from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog
import threading
import requests

def log_audit_action(db: Session, user_id: int, action: str, resource_type: str, resource_id: str = None, details: dict = None, ip_address: str = None):
    audit_log = AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        ip_address=ip_address
    )
    db.add(audit_log)
    db.commit()

def trigger_webhooks(db: Session, user_id: int, event: str, payload: dict):
    from app.models.webhook import Webhook
    
    webhooks = db.query(Webhook).filter(Webhook.user_id == user_id, Webhook.is_active == True).all()
    
    urls_to_call = []
    for wh in webhooks:
        events = [e.strip() for e in wh.events.split(",")]
        if event in events or "*" in events:
            urls_to_call.append(wh.url)
            
    if not urls_to_call:
        return
        
    def _fire():
        for url in urls_to_call:
            try:
                requests.post(url, json={"event": event, "data": payload}, timeout=5)
            except:
                pass
                
    threading.Thread(target=_fire, daemon=True).start()
