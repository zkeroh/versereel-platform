import sys
import os
import io
import qrcode
import telebot
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton

sys.stdout.reconfigure(encoding='utf-8')

# ==========================================
# CONFIGURAÇÃO DO BOT - VERSEREEL MEDIA
# ==========================================
BOT_TOKEN = "8842841532:AAH1JHomBONbV4pNPxNRwMDVp_r-0Bi5aT8"
ADMIN_CHAT_ID = "8712073475"

# Chave Pix Válida da Takenos (Registrada no Servidor da Takenos para Múltiplos Pagamentos de R$ 19,90)
PIX_KEY_TAKENOS = "00020126580014br.gov.bcb.pix0136ff439919-4119-405d-838a-6c3e3efd8b55520400005303986540519.905802BR5925Avenia Sociedade Prestado6009Sao Paulo622905252354685c84a44a8681d5abcb2630428CD"

LINK_VIP_PT = "https://xzkero.com/obrigado-dont-tell-dad.html"
LINK_VIP_EN = "https://xzkero.com/access-dont-tell-dad-en.html"

# Modo de Aprovação:
# True  = Entrega automática assim que o cliente enviar qualquer foto de comprovante
# False = O admin confirma manualmente com o botão [Aprovar]
AUTO_APPROVE_RECEIPTS = False

bot = telebot.TeleBot(BOT_TOKEN, parse_mode="HTML")

# ==========================================
# GERADOR DE IMAGEM QR CODE PIX
# ==========================================
def generate_pix_qr_image(pix_code):
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(pix_code)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    bio = io.BytesIO()
    bio.name = 'pix_qr.png'
    img.save(bio, 'PNG')
    bio.seek(0)
    return bio

# ==========================================
# MENUS DE BOTÕES
# ==========================================
def main_keyboard():
    markup = InlineKeyboardMarkup()
    markup.row(InlineKeyboardButton("📋 Copiar Chave Pix", callback_data="copy_pix"))
    markup.row(InlineKeyboardButton("🇺🇸 English Version", callback_data="lang_en"))
    return markup

def admin_approval_keyboard(user_id, username):
    markup = InlineKeyboardMarkup()
    markup.row(
        InlineKeyboardButton("✅ Aprovar e Enviar VIP", callback_data=f"approve_{user_id}"),
        InlineKeyboardButton("❌ Rejeitar", callback_data=f"reject_{user_id}")
    )
    return markup

# ==========================================
# TEXTOS DO BOT
# ==========================================
TEXT_WELCOME_PT = f"""🔥 <b>SIM! Comic Completo + Vídeos e Fotos extras liberados! 🚀</b>

O acesso ao pack exclusivo de <b>Don’t Tell Dad</b> é imediato por apenas <b>R$ 19,90</b>. Você recebe:

✅ Páginas HD sem censura (Leitura online + PDF)
✅ Ilustrações extras inéditas HD
✅ Vídeos e animações HD exclusivas

🔑 <b>COPIE O CÓDIGO PIX ABAIXO OU ESCANEIE O QR CODE PARA LIBERAR SEU ACESSO AGORA:</b>

<code>{PIX_KEY_TAKENOS}</code>

📌 <i>Assim que fizer o Pix de R$ 19,90, envie a foto do comprovante aqui e seu link VIP será liberado na hora! ⚡</i>
"""

TEXT_WELCOME_EN = f"""🔥 <b>YES! Full Comic + Uncensored Extra Videos & Photos unlocked! 🚀</b>

Immediate access to the <b>Don’t Tell Dad</b> VIP pack for only <b>R$ 19,90</b> (~$3.99 USD). You get:

✅ Full Uncensored HD Webtoon Pages (Online Reader + Download)
✅ Exclusive Unreleased HD Illustrations
✅ Exclusive HD Videos & Animations

🔑 <b>PAY VIA PIX (BRAZIL) USING THE CODE OR QR BELOW:</b>

<code>{PIX_KEY_TAKENOS}</code>

📌 <i>Once you complete the Pix payment, send the receipt image here and your VIP link will be delivered instantly! ⚡</i>
"""

# ==========================================
# MANIPULADORES
# ==========================================
@bot.message_handler(commands=['start', 'help'])
def send_welcome(message):
    qr_img = generate_pix_qr_image(PIX_KEY_TAKENOS)
    bot.send_photo(
        message.chat.id,
        photo=qr_img,
        caption=TEXT_WELCOME_PT,
        reply_markup=main_keyboard()
    )

@bot.callback_query_handler(func=lambda call: call.data in ["copy_pix", "lang_en", "lang_pt"])
def handle_callbacks(call):
    if call.data == "copy_pix":
        bot.answer_callback_query(call.id, "Chave Pix copiada!", show_alert=True)
        bot.send_message(
            call.message.chat.id,
            f"<b>Sua Chave Pix Copia e Cola (R$ 19,90):</b>\n\n<code>{PIX_KEY_TAKENOS}</code>\n\n📌 <i>Copie o código acima e envie o comprovante (foto/print) aqui no chat!</i>"
        )
    elif call.data == "lang_en":
        qr_img = generate_pix_qr_image(PIX_KEY_TAKENOS)
        bot.send_photo(
            call.message.chat.id,
            photo=qr_img,
            caption=TEXT_WELCOME_EN,
            reply_markup=main_keyboard()
        )

# ==========================================
# RECEBIMENTO DE COMPROVANTES
# ==========================================
@bot.message_handler(content_types=['photo', 'document'])
def handle_receipt(message):
    user_id = message.from_user.id
    user_name = message.from_user.first_name or "Cliente"
    username = f"@{message.from_user.username}" if message.from_user.username else f"ID: {user_id}"

    if AUTO_APPROVE_RECEIPTS:
        bot.reply_to(
            message,
            f"🎉 <b>Comprovante recebido com sucesso, {user_name}!</b>\n\n"
            f"Aqui está seu acesso VIP exclusivo:\n\n"
            f"👉 <b>Link de Acesso (PT):</b> {LINK_VIP_PT}\n"
            f"👉 <b>English VIP Link:</b> {LINK_VIP_EN}\n\n"
            f"<i>Obrigado e aproveite o conteúdo! 🔥</i>"
        )
        if ADMIN_CHAT_ID:
            try:
                caption = f"⚡ <b>NOVA VENDA AUTOMÁTICA!</b>\n\nCliente: {user_name} ({username})\nID: <code>{user_id}</code>"
                if message.content_type == 'photo':
                    bot.send_photo(ADMIN_CHAT_ID, message.photo[-1].file_id, caption=caption)
                else:
                    bot.send_document(ADMIN_CHAT_ID, message.document.file_id, caption=caption)
            except Exception as e:
                print(f"Erro ao notificar admin: {e}")
    else:
        bot.reply_to(
            message,
            "⏳ <b>Comprovante recebido!</b>\nEstamos validando seu pagamento Pix de R$ 19,90. Em instantes seu link VIP será liberado aqui no chat! ⚡"
        )
        if ADMIN_CHAT_ID:
            try:
                caption = f"📩 <b>NOVO COMPROVANTE RECEBIDO!</b>\n\nCliente: {user_name} ({username})\nID: <code>{user_id}</code>\n\nDeseja aprovar a entrega do Link VIP?"
                if message.content_type == 'photo':
                    bot.send_photo(
                        ADMIN_CHAT_ID,
                        message.photo[-1].file_id,
                        caption=caption,
                        reply_markup=admin_approval_keyboard(user_id, username)
                    )
                else:
                    bot.send_document(
                        ADMIN_CHAT_ID,
                        message.document.file_id,
                        caption=caption,
                        reply_markup=admin_approval_keyboard(user_id, username)
                    )
            except Exception as e:
                print(f"Erro ao enviar para admin: {e}")

@bot.callback_query_handler(func=lambda call: call.data.startswith("approve_") or call.data.startswith("reject_"))
def handle_admin_action(call):
    action, target_user_id = call.data.split("_")
    target_user_id = int(target_user_id)

    if action == "approve":
        try:
            bot.send_message(
                target_user_id,
                f"🎉 <b>Seu Pix foi APROVADO com sucesso!</b>\n\nAqui está seu acesso VIP exclusivo:\n\n"
                f"👉 <b>Link de Acesso VIP (PT):</b> {LINK_VIP_PT}\n"
                f"👉 <b>English VIP Link:</b> {LINK_VIP_EN}\n\n"
                f"<i>Obrigado e aproveite o conteúdo! 🔥</i>"
            )
            bot.edit_message_caption(
                f"✅ <b>VENDA APROVADA!</b>\nLink VIP enviado ao cliente (ID: {target_user_id}).",
                chat_id=call.message.chat.id,
                message_id=call.message.message_id
            )
        except Exception as e:
            bot.answer_callback_query(call.id, f"Erro ao enviar mensagem: {e}", show_alert=True)

    elif action == "reject":
        try:
            bot.send_message(
                target_user_id,
                "❌ <b>Não conseguimos validar seu comprovante.</b>\nPor favor, verifique se a transferência Pix de R$ 19,90 foi concluída com sucesso e envie o comprovante novamente."
            )
            bot.edit_message_caption(
                f"❌ <b>COMPROVANTE REJEITADO!</b>\nNotificação enviada ao cliente (ID: {target_user_id}).",
                chat_id=call.message.chat.id,
                message_id=call.message.message_id
            )
        except Exception as e:
            bot.answer_callback_query(call.id, f"Erro ao notificar cliente: {e}", show_alert=True)

@bot.message_handler(func=lambda message: True)
def handle_all_text(message):
    send_welcome(message)

if __name__ == "__main__":
    print("🤖 Bot Vendedor Versereel rodando no Telegram com Chave Pix Original Takenos Reutilizável...")
    bot.infinity_polling(skip_pending=True)
