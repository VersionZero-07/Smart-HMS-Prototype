"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-03-10
"""
from alembic import op
import sqlalchemy as sa

revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'patients',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('phone', sa.String(20), nullable=False),
        sa.Column('language', sa.String(10), nullable=False, server_default='en'),
        sa.Column('aadhaar_hash', sa.String(64), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        'departments',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(100), nullable=False, unique=True),
        sa.Column('name_translations', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('floor', sa.String(10), nullable=False, server_default='1'),
        sa.Column('room', sa.String(20), nullable=False, server_default='101'),
        sa.Column('icon', sa.String(10), nullable=False, server_default='🩺'),
        sa.Column('current_queue_depth', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('avg_wait_mins', sa.Integer(), nullable=False, server_default='15'),
    )

    op.create_table(
        'symptom_logs',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('patient_id', sa.Integer(), sa.ForeignKey('patients.id'), nullable=False),
        sa.Column('raw_text', sa.Text(), nullable=True),
        sa.Column('extracted_symptoms', sa.JSON(), nullable=True),
        sa.Column('language', sa.String(10), nullable=False, server_default='en'),
        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        'tokens',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('token_code', sa.String(10), nullable=False, unique=True),
        sa.Column('patient_id', sa.Integer(), sa.ForeignKey('patients.id'), nullable=False),
        sa.Column('department_id', sa.Integer(), sa.ForeignKey('departments.id'), nullable=False),
        sa.Column('severity', sa.String(10), nullable=False, server_default='LOW'),
        sa.Column('queue_number', sa.Integer(), nullable=False),
        sa.Column('appointment_window', sa.String(50), nullable=True),
        sa.Column('registered_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('floor_room', sa.String(50), nullable=True),
        sa.Column('is_priority', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('is_emergency_bypass', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('status', sa.String(20), nullable=False, server_default='WAITING'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        'queue',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('token_id', sa.Integer(), sa.ForeignKey('tokens.id'), nullable=False),
        sa.Column('department_id', sa.Integer(), sa.ForeignKey('departments.id'), nullable=False),
        sa.Column('priority_score', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('position', sa.Integer(), nullable=False),
        sa.Column('entered_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('called_at', sa.DateTime(timezone=True), nullable=True),
    )


def downgrade():
    op.drop_table('queue')
    op.drop_table('tokens')
    op.drop_table('symptom_logs')
    op.drop_table('departments')
    op.drop_table('patients')
