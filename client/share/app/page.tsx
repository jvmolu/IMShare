"use client";

import { socket } from "../socket";
import { useEffect, useState } from "react";

export default function Home() {
	const [isConnected, setIsConnected] = useState(false);
	const [transport, setTransport] = useState("N/A");

	useEffect(() => {
		if (socket && socket.connected) {
			onConnect();
		}

		function onConnect() {
			setIsConnected(true);
			setTransport(socket.io.engine.transport.name);

			socket.io.engine.on("upgrade", (transport) => {
				setTransport(transport.name);
			});
		}

		function onDisconnect() {
			setIsConnected(false);
			setTransport("N/A");
		}

		socket.on("connect", onConnect);
		socket.on("disconnect", onDisconnect);

		return () => {
			socket.off("connect", onConnect);
			socket.off("disconnect", onDisconnect);
		};
	}, [socket]);

	const handleConnect = () => {
		if (socket) {
			socket.connect();
		}
	};
	return (
		<div>
			<p>Status: {isConnected ? "connected" : "disconnected"}</p>
			<p>Transport: {transport}</p>
			<button onClick={handleConnect}>Connect</button>
		</div>
	);
}
