# NEXUS//TWIN Privacy

NEXUS//TWIN is an observability product, not spyware.

## What we collect (default)

- Hardware and OS identity (hostname, OS version, CPU model, etc.)
- Resource metrics (CPU, RAM, disk, GPU when available, network throughput)
- Process names, PIDs, and resource usage
- System events the agent can detect (boot, sleep when reported, threshold crossings)
- Agent health (version, collector status, queue size)

## What we do NOT collect by default

- Keystrokes or passwords
- Private documents or file contents
- Screenshots
- Microphone or webcam data
- Browser passwords or message contents
- Packet payloads / invasive traffic inspection

## Data association

All telemetry is bound to the authenticated owner's device. Other users cannot read it.

## Related

- [Web](web.md)
- [Root](../../NEXUS-TWIN.md)
