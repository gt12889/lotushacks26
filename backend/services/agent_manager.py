"""Agent orchestration with identity, lineage, and live tracking"""
import asyncio
import time
import uuid
import logging
from dataclasses import dataclass, field
from enum import Enum

logger = logging.getLogger(__name__)


class AgentStatus(str, Enum):
    SPAWNED = "spawned"
    RUNNING = "running"
    COMPLETE = "complete"
    FAILED = "failed"
    TIMEOUT = "timeout"


class AgentTier(int, Enum):
    OCR = 0
    SEARCH = 1
    VARIANT = 2
    ANALYST = 3
    INVESTIGATOR = 4


@dataclass
class AgentRecord:
    id: str
    tier: AgentTier
    name: str
    target: str  # pharmacy name or drug name
    parent_id: str | None = None
    status: AgentStatus = AgentStatus.SPAWNED
    started_at: float = field(default_factory=time.time)
    completed_at: float | None = None
    result_count: int = 0
    error: str | None = None


class AgentManager:
    """Tracks all agents in a search session with parent-child lineage."""

    def __init__(self):
        self._agents: dict[str, AgentRecord] = {}
        self._events: asyncio.Queue = asyncio.Queue()

    def spawn(self, tier: AgentTier, name: str, target: str, parent_id: str | None = None) -> str:
        """Register a new agent and return its ID."""
        agent_id = f"{tier.name[0]}{uuid.uuid4().hex[:5]}"
        record = AgentRecord(
            id=agent_id,
            tier=tier,
            name=name,
            target=target,
            parent_id=parent_id,
        )
        self._agents[agent_id] = record
        self._events.put_nowait({
            "type": "agent_spawn",
            "tier": tier.value,
            "agent_id": agent_id,
            "parent_id": parent_id,
            "name": name,
            "target": target,
        })
        logger.info(f"Agent {agent_id} spawned: {name} -> {target} (parent: {parent_id})")
        return agent_id

    def complete(self, agent_id: str, result_count: int = 0):
        """Mark agent as complete."""
        if agent_id in self._agents:
            self._agents[agent_id].status = AgentStatus.COMPLETE
            self._agents[agent_id].completed_at = time.time()
            self._agents[agent_id].result_count = result_count
            elapsed = self._agents[agent_id].completed_at - self._agents[agent_id].started_at
            self._events.put_nowait({
                "type": "agent_complete",
                "tier": self._agents[agent_id].tier.value,
                "agent_id": agent_id,
                "result_count": result_count,
                "elapsed_ms": int(elapsed * 1000),
            })

    def fail(self, agent_id: str, error: str):
        """Mark agent as failed."""
        if agent_id in self._agents:
            self._agents[agent_id].status = AgentStatus.FAILED
            self._agents[agent_id].completed_at = time.time()
            self._agents[agent_id].error = error
            self._events.put_nowait({
                "type": "agent_fail",
                "tier": self._agents[agent_id].tier.value,
                "agent_id": agent_id,
                "error": error,
            })

    async def get_event(self, timeout: float = 0.1) -> dict | None:
        """Get next event from queue (non-blocking with timeout)."""
        try:
            return await asyncio.wait_for(self._events.get(), timeout=timeout)
        except asyncio.TimeoutError:
            return None

    def drain_events(self) -> list[dict]:
        """Get all pending events without blocking."""
        events = []
        while not self._events.empty():
            try:
                events.append(self._events.get_nowait())
            except asyncio.QueueEmpty:
                break
        return events

    @property
    def stats(self) -> dict:
        """Live agent statistics."""
        total = len(self._agents)
        active = sum(1 for a in self._agents.values() if a.status in (AgentStatus.SPAWNED, AgentStatus.RUNNING))
        complete = sum(1 for a in self._agents.values() if a.status == AgentStatus.COMPLETE)
        failed = sum(1 for a in self._agents.values() if a.status in (AgentStatus.FAILED, AgentStatus.TIMEOUT))
        return {"total": total, "active": active, "complete": complete, "failed": failed}

    @property
    def tree(self) -> list[dict]:
        """Agent lineage tree for visualization."""
        return [
            {
                "id": a.id,
                "tier": a.tier.value,
                "name": a.name,
                "target": a.target,
                "parent_id": a.parent_id,
                "status": a.status.value,
                "result_count": a.result_count,
            }
            for a in self._agents.values()
        ]
