"""add trigger to sync auth.users with users

Revision ID: 4d4b38e3b04e
Revises: ca632e07f0c9
Create Date: 2025-08-20 10:57:58.762295

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '4d4b38e3b04e'
down_revision = 'ca632e07f0c9'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
    create function handle_new_user()
    returns trigger as $$
    begin
      insert into public.users (id, email, created_at)
      values (new.id, new.email, now());
      return new;
    end;
    $$ language plpgsql security definer;

    create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function handle_new_user();
    """)

def downgrade():
    op.execute("""
    drop trigger if exists on_auth_user_created on auth.users;
    drop function if exists handle_new_user();
    """)
