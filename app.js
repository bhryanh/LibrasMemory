const electron = require('electron');
const url = require('url');
const path = require('path');
var fs = require('fs');

const {app, BrowserWindow, Menu, ipcMain} = electron;

//SET ENV
process.env.NODE_ENV = 'dev';
app.setPath("userData", __dirname + "/saved_recordings")

let mainWindow;
let addWindow;
let recordWindow;

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

function createAddWindow(){
    addWindow = new BrowserWindow({
        width: 300,
        height: 200,
        title: 'Add Video',
        webPreferences: {
            nodeIntegration: true
        }
    });
    addWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'addWindow.html'),
        protocol: 'file:',
        slashes: true
    }));

    addWindow.on('close', function(){
        addWindow = null;
    });
};

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

// Catch item:add
ipcMain.on('item:add', function (e, item){
    mainWindow.webContents.send('item:add', item);
    addWindow.close();
});

// Catch card:add
ipcMain.on('card:add', function (e, item){
    saveCard(item);
    mainWindow.webContents.send('card:add', item);
    recordWindow.close();
});

//Create menu template
const mainMenuTemplate = [
    {
        label: 'File',
        submenu:[
            {
                label:"Record Video",
                click(){
                    createRecordWindow();
                }
            },
            {
                label: "Add Video",
                click(){
                    createAddWindow();
                }
            },
            {
                label: "Clear Video",
                click(){
                    mainWindow.webContents.send('item:clear');
                }
            },
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
    fs.readFile('user.json', 'utf8', function readFileCallback(err, data){
        if (data === undefined){
            var obj = {
                user: []
            };
            obj.user.push(card);
            var json = JSON.stringify(obj);
            var fs = require('fs');
            fs.writeFile('user.json', json, 'utf8', function writeFileCallback(err, data){if (err){console.log(err);}});
        } 
        else {
            obj = JSON.parse(data); //now it an object
            obj.user.push(card); //add some data
            json = JSON.stringify(obj); //convert it back to json
            var fs = require('fs');
            fs.writeFile('user.json', json, 'utf8', function writeFileCallback(err, data){if (err){console.log(err);}}); // write it back 
        }});
};

