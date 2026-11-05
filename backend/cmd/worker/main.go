package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	log.Println("Renderly worker scaffold started; queue consumer not wired yet.")
	<-ctx.Done()
	log.Println("Renderly worker shutting down.")
}
