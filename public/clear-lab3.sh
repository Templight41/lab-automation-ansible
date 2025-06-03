sudo chmod 444 /media/cselab3
sudo chmod 444 /media/guest1
sudo chmod 444 /media/labexam
sudo chmod 444 /media/exam3

sudo rm -Rf /home/exam3/*
sudo rm -Rf /home/labexam/*
sudo rm -Rf /home/guest1/*
sudo rm -Rf /home/cselab3/*

sudo rm -Rf /home/cselab3/.local/share/Trash/*
sudo rm -Rf /home/guest1/.local/share/Trash/*
sudo rm -Rf /home/exam3/.local/share/Trash/*
sudo rm -Rf /home/labexam/.local/share/Trash/*

sudo mkdir /home/cselab3/Desktop
sudo mkdir /home/cselab3/Downloads
sudo mkdir /home/cselab3/Documents

sudo mkdir /home/guest1/Desktop
sudo mkdir /home/guest1/Downloads
sudo mkdir /home/guest1/Documents

sudo chown cselab3 /home/cselab3/Desktop
sudo chown cselab3 /home/cselab3/Downloads
sudo chown cselab3 /home/cselab3/Documents

sudo chgrp cselab3 /home/cselab3/Desktop
sudo chgrp cselab3 /home/cselab3/Downloads
sudo chgrp cselab3 /home/cselab3/Documents

sudo chown guest1 /home/guest1/Desktop
sudo chown guest1 /home/guest1/Downloads
sudo chown guest1 /home/guest1/Documents

sudo chgrp guest1 /home/guest1/Desktop
sudo chgrp guest1 /home/guest1/Downloads
sudo chgrp guest1 /home/guest1/Documents
hostname -I