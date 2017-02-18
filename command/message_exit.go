package main

import (
	"os"

	"golang.org/x/net/websocket"
)

type ExitMessage Message

func (d ExitMessage) Handle(ws *websocket.Conn, client *Client, data string) error {
	os.Exit(0)
	return nil
}
