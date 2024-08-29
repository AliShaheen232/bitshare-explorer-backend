create .env file

```
cp .env.example .env
```

install PM2 on an Ubuntu system

```
sudo apt update
sudo apt upgrade -y
```

install nodeJs if not available

install pm2

```
sudo npm install -g pm2
pm2 --version
```

Install node_modules

```
npm install 
```

set mongoDB connection URI in .env , and set pem file in local and change connection URI accordingly. 