# Route Reliability Research Prototype

This local Flask application is a DECO6500 research prototype for evaluating how Brisbane bus passengers interpret uncertain live arrival information, historical reliability, and advisory recommendations. It is intentionally limited to controlled participant evaluation.

## Run locally

```bash
python -m venv .venv
source .venv/bin/activate
pip install flask
python app.py
```

Open <http://127.0.0.1:5000/>.

On Windows, activate the environment with `.venv\Scripts\activate`.

## Scenarios

- **A — Simple delay:** a static four-minute delay with strong historical reliability.
- **B — Repeated ETA change:** the live ETA changes from 6 to 9 to 12 minutes.
- **C — Live data unavailable:** a displayed ETA becomes unavailable and an alternative route appears.

The researcher selects scenarios manually, shows the participant the common context, and then starts each timed scenario. Reset cancels all pending changes and returns to that scenario's context.

All service, arrival, historical, and alternative-route data are simulated. The prototype uses no external API or database and does not collect or store participant data.
