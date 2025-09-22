import uuid
from datetime import datetime
from db import db  # <-- import db from db.py


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = db.Column(db.String(255), unique=True, nullable=False)
    first_name = db.Column(db.String(255), nullable=True)
    last_name = db.Column(db.String(255), nullable=True)
    password_hash = db.Column(db.String(255), nullable=True)  # Made nullable for OAuth users
    google_id = db.Column(db.String(255), unique=True, nullable=True)
    profile_picture_url = db.Column(db.String(500), nullable=True)
    auth_provider = db.Column(db.String(50), nullable=True)  # 'google', 'email', etc.
    email_verified = db.Column(db.Boolean, default=False)
    is_guest = db.Column(db.Boolean, default=False)
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
    data = db.Column(db.JSON, nullable=True)  # <-- Added JSON field
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
    data = db.Column(db.JSON, nullable=True)  # <-- Added JSON field
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    invoices = db.relationship('Invoice', backref='business', lazy=True)

class Invoice(db.Model):
    __tablename__ = 'invoices'
    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(db.UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    client_id = db.Column(db.UUID(as_uuid=True), db.ForeignKey('clients.id', ondelete='SET NULL'), nullable=True)
    business_id = db.Column(db.UUID(as_uuid=True), db.ForeignKey('businesses.id', ondelete='SET NULL'), nullable=True)  # <-- Add this
    data = db.Column(db.JSON, nullable=False)  # already present
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
    type = db.Column(db.String(50), default='info')  # 'info', 'success', 'warning', 'error'
    is_read = db.Column(db.Boolean, default=False)
    related_entity_type = db.Column(db.String(50), nullable=True)  # 'invoice', 'client', etc.
    related_entity_id = db.Column(db.UUID(as_uuid=True), nullable=True)  # ID of the related entity
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship
    user = db.relationship('User', backref=db.backref('notifications', lazy=True, cascade="all, delete-orphan"))

