import uuid
from datetime import datetime
from db import db


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = db.Column(db.String(255), unique=True, nullable=False)
    first_name = db.Column(db.String(255), nullable=True)
    last_name = db.Column(db.String(255), nullable=True)
    password_hash = db.Column(db.String(255), nullable=True)
    google_id = db.Column(db.String(255), unique=True, nullable=True)
    profile_picture_url = db.Column(db.String(500), nullable=True)
    auth_provider = db.Column(db.String(50), nullable=True)
    email_verified = db.Column(db.Boolean, default=False)
    is_guest = db.Column(db.Boolean, default=False)
    plan = db.Column(db.String(20), nullable=False, default='free', server_default='free')  # 'free' | 'pro'
    data = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    clients = db.relationship('Client', backref='user', lazy=True, cascade="all, delete-orphan")
    invoices = db.relationship('Invoice', backref='user', lazy=True, cascade="all, delete-orphan")
    businesses = db.relationship('Business', backref='user', lazy=True, cascade="all, delete-orphan")


class Client(db.Model):
    __tablename__ = 'clients'
    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(db.UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255))
    address = db.Column(db.Text)
    phone = db.Column(db.String(50))
    data = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    invoices = db.relationship('Invoice', backref='client', lazy=True)


class Business(db.Model):
    __tablename__ = 'businesses'
    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(db.UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255))
    address = db.Column(db.Text)
    phone = db.Column(db.String(50))
    tax_id = db.Column(db.String(100))
    paystack_subaccount_code = db.Column(db.String(100), nullable=True)
    is_verified = db.Column(db.Boolean, default=False, nullable=True)
    data = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    invoices = db.relationship('Invoice', backref='business', lazy=True)


class Invoice(db.Model):
    __tablename__ = 'invoices'
    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(db.UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    client_id = db.Column(db.UUID(as_uuid=True), db.ForeignKey('clients.id', ondelete='SET NULL'), nullable=True)
    business_id = db.Column(db.UUID(as_uuid=True), db.ForeignKey('businesses.id', ondelete='SET NULL'), nullable=True)
    data = db.Column(db.JSON, nullable=False)
    issued_date = db.Column(db.Date)
    due_date = db.Column(db.Date)
    status = db.Column(db.String(50), default='draft')
    currency = db.Column(db.String(10), default='USD')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Notification(db.Model):
    __tablename__ = 'notifications'
    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(db.UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50), default='info')
    is_read = db.Column(db.Boolean, default=False)
    related_entity_type = db.Column(db.String(50), nullable=True)
    related_entity_id = db.Column(db.UUID(as_uuid=True), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref=db.backref('notifications', lazy=True, cascade="all, delete-orphan"))


class SubscriptionPlan(db.Model):
    __tablename__ = 'subscription_plans'
    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(50), nullable=False)  # 'free', 'pro'
    price = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    currency = db.Column(db.String(3), default='NGN')
    paystack_plan_code = db.Column(db.String(255), nullable=True)  # For recurring payments
    features = db.Column(db.JSON, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class UserSubscription(db.Model):
    __tablename__ = 'user_subscriptions'
    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(db.UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    plan_id = db.Column(db.UUID(as_uuid=True), db.ForeignKey('subscription_plans.id'), nullable=False)
    paystack_subscription_code = db.Column(db.String(255), nullable=True)
    status = db.Column(db.String(20), default='active')  # 'active', 'cancelled', 'expired'
    current_period_start = db.Column(db.DateTime, default=datetime.utcnow)
    current_period_end = db.Column(db.DateTime, nullable=False)
    cancel_at_period_end = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref=db.backref('subscription', uselist=False))
    plan = db.relationship('SubscriptionPlan', backref='subscriptions')


class BillingTransaction(db.Model):
    __tablename__ = 'billing_transactions'
    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(db.UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    subscription_id = db.Column(db.UUID(as_uuid=True), db.ForeignKey('user_subscriptions.id'), nullable=True)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(db.String(3), default='NGN')
    status = db.Column(db.String(20), default='pending')
    description = db.Column(db.String(255))
    paystack_reference = db.Column(db.String(255), nullable=True)
    paystack_transaction_id = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='billing_transactions')
    subscription = db.relationship('UserSubscription', backref='transactions')