"""
Redis Pub/Sub — Real-time queue update broadcasting.
Publishes queue changes to channel f"queue:{department}".
"""
import os
import json
import redis
from typing import Optional

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

_redis_client: Optional[redis.Redis] = None


def get_redis() -> Optional[redis.Redis]:
    global _redis_client
    if _redis_client is None:
        try:
            _redis_client = redis.from_url(REDIS_URL, decode_responses=True)
            _redis_client.ping()
        except (redis.ConnectionError, redis.RedisError):
            _redis_client = None
    return _redis_client


def publish_queue_update(department: str, data: dict):
    """Publish queue update event to Redis channel."""
    client = get_redis()
    if client is None:
        return
    channel = f"queue:{department}"
    try:
        client.publish(channel, json.dumps(data))
    except (redis.ConnectionError, redis.RedisError):
        pass


def publish_token_called(department: str, token_id: str):
    """Publish token-called event."""
    publish_queue_update(department, {
        "event": "token_called",
        "token_id": token_id,
        "department": department,
    })


def publish_new_token(department: str, token_id: str, position: int, severity: str):
    """Publish new-token event."""
    publish_queue_update(department, {
        "event": "new_token",
        "token_id": token_id,
        "position": position,
        "severity": severity,
        "department": department,
    })


def get_cached_queue(department: str) -> Optional[dict]:
    """Get cached queue state from Redis."""
    client = get_redis()
    if client is None:
        return None
    try:
        data = client.get(f"queue_state:{department}")
        if data:
            return json.loads(data)
    except (redis.ConnectionError, redis.RedisError):
        pass
    return None


def cache_queue_state(department: str, state: dict, ttl: int = 30):
    """Cache current queue state in Redis with TTL."""
    client = get_redis()
    if client is None:
        return
    try:
        client.setex(f"queue_state:{department}", ttl, json.dumps(state))
    except (redis.ConnectionError, redis.RedisError):
        pass
