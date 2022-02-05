const express = require('express')
const ytsearch = require('yt-search')
const youtubemp3downloader = require('youtube-mp3-downloader')
const fs = require('fs')

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
    console.log(`[REQUETE] : ${req.body.nom}`)

    const video = await VideoFinder(req.body.nom)

    const id_video = video.url.split('?v=')[1]

    YD.download(id_video)

    YD.on('finished', () => {
        console.log('[REQUETE] : fin du téléchargement !')

        res.download(`${__dirname}/musique/${video.title}.mp3`)
    })

})