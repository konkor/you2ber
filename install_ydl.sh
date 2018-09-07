#!/usr/bin/env bash

if [ $1 = "install" ]
then
	wget https://yt-dl.org/downloads/latest/youtube-dl -O /usr/local/bin/youtube-dl
    chmod a+rx /usr/local/bin/youtube-dl
	exit
fi

if [ $1 = "update" ]
then
    PATH=$PATH:/usr/local/bin
	exec youtube-dl -U
	exit
fi

