# FUN manaba API server
## JUST FOR FUN, DON'T USE AS PRODUCTION
This package contains awful API, so **PLEASE USE ONLY FOR EXPERIMENTS**.

## Usage
```
yarn install
env PORT=8080 yarn start
```

```
curl -o - http://localhost:8080/b1000000.ical?pw=PASSWORD
curl -o - http://localhost:8080/b1000000.json?pw=PASSWORD
```

## Warning
This server requests authentification to manaba.fun.ac.jp **for each request**.
So please don't call this API repeatedly.