#!/usr/bin/env python
import sys
import os

# Add the current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from db import db
from models import SubscriptionPlan
import uuid

# Import your app instance directly
from app import app

def seed_subscription_plans():
    """Seed subscription plans into database"""
    
    with app.app_context():
        # Check if plans already exist
        existing_free = SubscriptionPlan.query.filter_by(name='free').first()
        existing_pro = SubscriptionPlan.query.filter_by(name='pro').first()
        
        if existing_free and existing_pro:
            print("✅ Subscription plans already exist. Skipping seed.")
            return
        
        # Free plan
        free_plan = SubscriptionPlan(
            id=uuid.uuid4(),
            name='free',
            price=0,
            currency='NGN',
            features={
                'businesses': 1,
                'invoices_per_month': 5,
                'support': 'email',
                'analytics': 'basic'
            },
            is_active=True
        )
        
        # Pro plan
        pro_plan = SubscriptionPlan(
            id=uuid.uuid4(),
            name='pro',
            price=2999,  # 29.99 in NGN (2999 kobo)
            currency='NGN',
            features={
                'businesses': 'unlimited',
                'invoices_per_month': 'unlimited',
                'support': 'priority',
                'analytics': 'advanced',
                'custom_branding': True,
                'api_access': True
            },
            is_active=True
        )
        
        try:
            db.session.add(free_plan)
            db.session.add(pro_plan)
            db.session.commit()
            print("✅ Successfully seeded subscription plans:")
            print(f"   - Free Plan (₦{free_plan.price})")
            print(f"   - Pro Plan (₦{pro_plan.price / 100:.2f})")
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error seeding plans: {str(e)}")

if __name__ == '__main__':
    seed_subscription_plans()