import websockets
import asyncio

async def test():
    async with websockets.connect('ws://localhost:8000/ws') as ws:
        print('WebSocket connected')
        await ws.send('test')
        response = await ws.recv()
        print(f'Received: {response}')

asyncio.run(test())