import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import AWSIoTData from "aws-iot-device-sdk";

const AWS_CONFIG = {
  region: "us-east-1",
  host: "xxxxxxxxxx.iot.us-east-1.amazonaws.com", // Reemplazar con tu endpoint de AWS IoT
  clientId: "web-client",
  protocol: "wss",
  accessKeyId: "TU_ACCESS_KEY",
  secretKey: "TU_SECRET_KEY",
};

export default function InvernaderoDashboard() {
  const [temperature, setTemperature] = useState([]);
  const [humidity, setHumidity] = useState([]);
  const [connected, setConnected] = useState(false);
  const [timeSeries, setTimeSeries] = useState([]);

  useEffect(() => {
    const client = AWSIoTData.device(AWS_CONFIG);
    client.on("connect", () => {
      setConnected(true);
      client.subscribe("invernadero/datos");
    });
    client.on("message", (topic, payload) => {
      const data = JSON.parse(payload.toString());
      setTemperature(prev => [...prev.slice(-20), data.temperatura]);
      setHumidity(prev => [...prev.slice(-20), data.humedad]);
      setTimeSeries(prev => [...prev.slice(-20), { time: new Date().toLocaleTimeString(), temperatura: data.temperatura, humedad: data.humedad }]);
    });
    return () => client.end();
  }, []);

  const handleToggleIrrigation = () => {
    const client = AWSIoTData.device(AWS_CONFIG);
    client.publish("invernadero/comandos", JSON.stringify({ riego: "ON" }));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold text-green-700 mb-4">Dashboard Invernadero</h1>
      <Card className="w-96 text-center shadow-lg rounded-lg bg-white p-4">
        <CardContent>
          <p className="text-xl font-semibold text-gray-700">Temperatura: {temperature[temperature.length - 1] ?? "Cargando..."} °C</p>
          <p className="text-xl font-semibold text-gray-700">Humedad: {humidity[humidity.length - 1] ?? "Cargando..."} %</p>
          <p className="mt-2 text-sm text-gray-500">Estado de conexión: {connected ? "Conectado" : "Desconectado"}</p>
          <Button onClick={handleToggleIrrigation} className="mt-4 bg-green-500 hover:bg-green-700 text-white">Activar Riego</Button>
        </CardContent>
      </Card>
      <div className="w-full max-w-2xl mt-6">
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">Historial de Datos</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timeSeries}>
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="temperatura" stroke="#FF4500" strokeWidth={2} />
            <Line type="monotone" dataKey="humedad" stroke="#1E90FF" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
