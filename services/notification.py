import logging
from typing import Dict, Any

logger = logging.getLogger('kisansetu.notifications')

def send_sms(phone: str, message: str, language: str = 'en') -> Dict[str, Any]:
    """Send SMS notification (stub implementation)."""
    logger.info(f'[SMS STUB] To: {phone} | Lang: {language} | Message: {message}')
    return {'status': 'sent', 'provider': 'stub', 'phone': phone, 'message': message}

def send_booking_confirmation(phone: str, token: str, centre_name: str, slot_time: str, language: str = 'en') -> Dict[str, Any]:
    """Send booking confirmation SMS."""
    if language == 'hi':
        msg = f'किसानसेतु: आपका टोकन {token} पक्का हुआ। {centre_name}, समय: {slot_time}। कृपया 15 मिनट पहले पहुँचें।'
    else:
        msg = f'KisanSetu: Token {token} confirmed at {centre_name}, Time: {slot_time}. Please arrive 15 min early.'
    return send_sms(phone, msg, language)

def send_queue_update(phone: str, position: int, estimated_wait: int, language: str = 'en') -> Dict[str, Any]:
    """Send queue position update SMS."""
    if language == 'hi':
        msg = f'किसानसेतु: आपकी कतार स्थिति: {position}, अनुमानित प्रतीक्षा: {estimated_wait} मिनट'
    else:
        msg = f'KisanSetu: Queue position: {position}, Est. wait: {estimated_wait} min'
    return send_sms(phone, msg, language)

def send_token_called(phone: str, token: str, language: str = 'en') -> Dict[str, Any]:
    """Notify farmer their token has been called."""
    if language == 'hi':
        msg = f'किसानसेतु: आपका टोकन {token} बुलाया गया है! कृपया काउंटर पर आएं।'
    else:
        msg = f'KisanSetu: Your token {token} has been called! Please proceed to the counter.'
    return send_sms(phone, msg, language)

def send_payment_notification(phone: str, amount: float, language: str = 'en') -> Dict[str, Any]:
    """Notify farmer about payment initiation."""
    if language == 'hi':
        msg = f'किसानसेतु: ₹{amount:,.2f} का भुगतान शुरू किया गया है। कृपया अपना बैंक खाता जांचें।'
    else:
        msg = f'KisanSetu: Payment of ₹{amount:,.2f} has been initiated. Please check your bank account.'
    return send_sms(phone, msg, language)

def trigger_ivr(phone: str, flow_id: str = 'default') -> Dict[str, Any]:
    """Trigger IVR call (stub implementation)."""
    logger.info(f'[IVR STUB] To: {phone} | Flow: {flow_id}')
    return {'status': 'initiated', 'provider': 'stub', 'phone': phone, 'flow_id': flow_id}
