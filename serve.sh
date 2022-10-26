#!/bin/sh
git config pull.rebase false
git reset --hard HEAD && git clean -fd && git pull
chmod +x ./serve.sh
npm install
npm run build
# Move the files in place
rm -rf /var/www/vue-manipulate-svg/*
cp -r ./.output/public/ /var/www/vue-manipulate-svg/
# Fix permissions
chgrp -hR webdev /var/www/vue-manipulate-svg
