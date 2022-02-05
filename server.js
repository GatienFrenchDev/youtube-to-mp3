const express = require('express')
const ytsearch = require('yt-search')
const youtubemp3downloader = require('youtube-mp3-downloader')
const fs = require('fs')
const path = require('path')


// vide le dossier musique
fs.readdir('musique', (err, files) => {
    if (err) throw err
    for (const file of files) {
      fs.unlink(path.join('musique', file), err => {
        if (err) throw err;
    })
   }
})

const app = express()

const VideoFinder = async (query) => {
    const VideoResult = await ytsearch(query)

    return (VideoResult.videos.length > 1) ? VideoResult.videos[0] : null
}


const YD = new youtubemp3downloader({
    "ffmpegPath": "./ffmpeg/bin/ffmpeg.exe",
    "outputPath": "./musique/",
    "youtubeVideoQuality": "lowestaudio",
    "queueParallelism": 2, // Download parallelism (default: 1)
    "progressTimeout": 2000,
    "allowWebm": false
})


app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.use('/', express.static(__dirname + '/public/'))

app.listen(80, () => {
    console.log('🚀 serveur lancé ! http://127.0.0.1:80')
})

app.post('/dl', async (req, res) => {

    if(!req.headers['user-agent']){
        res.send('error : no user agent given')
    }

    console.log(`[REQUETE] : ${req.body.nom}\n[IP] : ${req.hostname}\n[PLATEFORME] : ${req.headers['user-agent']}`)

    const video = await VideoFinder(req.body.nom)

    const id_video = video.url.split('?v=')[1]

    if(video.duration.seconds>360){ // vérifie que la vidéo ne fais pas plus de 6 min.
        res.send('erreur : vidéo trop longue')
        return
    }

    YD.download(id_video)

    YD.on('finished', () => {
        console.log('[REQUETE] : fin du téléchargement !')
        let path = video.title.replace(/[|"<>?]/g, "")
        path = path.trim()
        res.download(`${__dirname}/musique/${path}.mp3`)
    })

})