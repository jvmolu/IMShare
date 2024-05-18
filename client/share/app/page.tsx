"use client";

import { socket } from "../socket";
import { useEffect, useState } from "react";

export default function Home() {
	const [isConnected, setIsConnected] = useState(false);
	const [transport, setTransport] = useState("N/A");
	const [id, setid] = useState("");
	const [message, setMessage] = useState(null);
	const [inputMessage, setInputMessage] = useState("");

	useEffect(() => {

		if (socket && socket.connected) {
			onConnect();
		}

		function handlePong(msg: any) {
			console.log("pong");
			setMessage(msg); // set the message state variable
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
		socket.on("pong", handlePong);

		return () => {
			socket.off("connect", onConnect);
			socket.off("disconnect", onDisconnect);
			socket.off("pong", handlePong);
		};

	}, [socket]);

	const handleConnect = () => {
		if (socket) {
			socket.connect();
			socket.emit("get_id", (response: any) => {
				console.log(response.id);
				setid(response.id);
			});
		}
	};

	const messages = () => {
		socket.emit("ping");
		if (socket) {
			socket.emit("message", inputMessage);
			setInputMessage(""); // clear the input field
		}
	};

	return (
		<div className="flex flex-col items-center justify-center h-screen">
			<p>Status: {isConnected ? "connected" : "disconnected"}</p>
			<p>Transport: {transport}</p>
			<p>Connection ID: {id}</p>
			<button
				onClick={handleConnect}
				style={{
					backgroundColor: "#ADD8E6",
					border: "none",
					color: "black",
					padding: "15px 32px",
					textAlign: "center",
					textDecoration: "none",
					display: "inline-block",
					fontSize: "16px",
					margin: "4px 2px",
					cursor: "pointer",
					borderRadius: "12px",
				}}
			>
				Connect and getId
			</button>
			<br />
			<button
				onClick={() => socket.disconnect()}
				style={{
					backgroundColor: "#ADD8E6",
					border: "none",
					color: "black",
					padding: "15px 32px",
					textAlign: "center",
					textDecoration: "none",
					display: "inline-block",
					fontSize: "16px",
					margin: "4px 2px",
					cursor: "pointer",
					borderRadius: "12px",
				}}
			>
				Disconnect
			</button>
			<br />
			<input
				type="text"
				value={inputMessage}
				onChange={(e) => {
					setInputMessage(e.target.value);
				}}
				style={{
					color: "black",
				}}
			/>
			<br />
			<button
				onClick={messages}
				style={{
					backgroundColor: "#ADD8E6",
					border: "none",
					color: "black",
					padding: "15px 32px",
					textAlign: "center",
					textDecoration: "none",
					display: "inline-block",
					fontSize: "16px",
					margin: "4px 2px",
					cursor: "pointer",
					borderRadius: "12px",
				}}
			>
				Send message
			</button>
			<h1>Messages :</h1>
			<p>{message}</p>
		</div>
	);
}
