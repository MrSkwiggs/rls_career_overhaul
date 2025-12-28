# Vue3 Based UI for BeamNG.Drive

## Running the Game

If you run normally, the game will load the Vue related files from the `dist` folder (i.e. the production build). If you want run in the game in 'development mode' to work on the Vue UI (including hot reloads), you will need to:

1. Run the Vue development server: `npm run serve` or `npm run dev`. The second script will also start the ui dev tools located in `ui\uidevtools`.
2. Run the game, pointing CEF at the development UI page: `-cefstarturl local://local/ui/entrypoints/main/index.html?vuedev=1`

You can also create a batch script `run-vue.cmd` inside a game directory and use it to start both Vue dev server and the game.
```
@echo off
cd ui\ui-vue
start npm run serve
cd ..\..
set path=Bin64;%path%
start beamng.drive -console -cefstarturl local://local/ui/entrypoints/main/index.html?vuedev=1
```


## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```
