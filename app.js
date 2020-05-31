const electron = require('electron');
const url = require('url');
const path = require('path');
var fs = require('fs');

const {app, BrowserWindow, Menu, ipcMain} = electron;

process.env.NODE_ENV = 'dev';
app.setPath("userData", __dirname + "/saved_recordings")
var basePath = process.env.USERPROFILE+'\\Documents\\LibrasMemory';
var videoPath = basePath + '\\videos\\'
fs.mkdir(videoPath, { recursive: true }, (err) => {if (err) throw err;});
var userConfPath = basePath + '\\user.json';

let mainWindow;
let recordWindow;
let videoWindow;

let videoToPlay = {};

//Listen for app to be ready
app.on('ready', function(){
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        }
    });
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'mainWindow.html'),
        protocol: 'file:',
        slashes: true
    }));
    //Quit app when closed
    mainWindow.on('closed', function(){
        app.quit();
    });

    //Build Menu from template
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);

    Menu.setApplicationMenu(mainMenu);
});

function createRecordWindow(){
    recordWindow = new BrowserWindow({
        width: 800,
        height: 600,
        title: 'Record Video',
        webPreferences: {
            nodeIntegration: true
        }
    });
    recordWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'recordWindow.html'),
        protocol: 'file:',
        slashes: true
    }));

    recordWindow.on('close', function(){
        recordWindow = null;
    });
};

function createVideoWindow(item){
    videoWindow = new BrowserWindow({
        width: 800,
        height: 600,
        title: 'Play Video',
        webPreferences: {
            nodeIntegration: true
        }
    });
    videoWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'videoWindow.html'),
        protocol: 'file:',
        slashes: true
    }));

    videoWindow.on('close', function(){
        videoWindow = null;
    });
};

ipcMain.on('card:add', function (e, item){
    saveCard(item);
    mainWindow.webContents.send('card:add', item);
    recordWindow.close();
});

ipcMain.on('card:remove', function (e, item){
    removeCard(item);
});

ipcMain.on('video:play', function (e, item){
    createVideoWindow();
    videoToPlay = item;
});

ipcMain.on('video:get', function (e, item){
    e.sender.send('video:info', videoToPlay);
});

ipcMain.on('video:create', function (e, item){
    createRecordWindow();
});

ipcMain.on('video:close', function (e, item){
    videoWindow.close();
});



//Create menu template
const mainMenuTemplate = [
    {
        label: 'File',
        submenu:[
            {
                label: "Quit",
                accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
                click(){
                    app.quit();
                }
            }
        ]
    }
];
    
// If mac, add empty object to menu
if(process.platform == 'darwin')
{
    mainMenuTemplate.unshift({});
}

//Add developer tools item if not in prod
if(process.env.NODE_ENV !== 'production')
{
    mainMenuTemplate.push({
        label: 'Developer Tools',
        submenu:[
            {
                label: 'Toggle DevTools',
                accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
                click(item, focusedWindow){
                    focusedWindow.toggleDevTools();
                }
            },
            {
                role: 'reload'
            }
        ]
    });
};

function saveCard(card)
{
    fs.readFile(userConfPath, 'utf8', function readFileCallback(err, data){
        if (data === undefined)
        {
            var obj = 
            {
                user: [],
                countId: 1
            };
            card.id = obj.countId;
            obj.countId++;
            obj.user.push(card);
            var json = JSON.stringify(obj);
            var fs = require('fs');
            fs.writeFile(userConfPath, json, 'utf8', function writeFileCallback(err, data){if (err){console.log(err);}});
        } 
        else {
            obj = JSON.parse(data); //now it an object
            card.id = obj.countId;
            obj.countId++;
            obj.user.push(card); //add some data
            json = JSON.stringify(obj); //convert it back to json
            var fs = require('fs');
            fs.writeFile(userConfPath, json, 'utf8', function writeFileCallback(err, data){if (err){console.log(err);}}); // write it back 
        }});
};

function removeCard(card)
{
    fs.readFile(userConfPath, 'utf8', function readFileCallback(err, data)
    {
        let obj = JSON.parse(data);
        let idx = obj.user.findIndex(x => x.id == card.id);
        obj.user.splice(idx, 1);
        let json = JSON.stringify(obj); 
        var fs = require('fs');
        fs.writeFile(userConfPath, json, 'utf8', function writeFileCallback(err, data){if (err){console.log(err);}}); // write it back 
    });
    removeVideo(card);
};

function removeVideo(card)
{
    fs.unlink(card.videoFile, (err) => {
        if (err) {
          console.error(err)
          return
        }
    });
};

