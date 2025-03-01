const APP_ID = "354ec366f18b4215afbe292e73f7ab08"

let uid = sessionStorage.getItem("uid")

if (!uid) {
    uid = String(Math.floor(Math.random() * 10000))
    sessionStorage.setItem("uid", uid)
}

let token = null;

let client;

const queryStr = window.location.search
const urlParam = new URLSearchParams(queryStr)

let roomId = urlParam.get('room')

if (!roomId) {
    roomId = "main"
    sessionStorage.setItem("roomId", roomId)
}

let localTracks = []
let remoteUsers = {}

let joinRoomInit = async () => {
    // codec is an encoding method used by browser
    client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" })
    await client.join(APP_ID, roomId, token, uid)

    client.on('user-published', handleUserPublished)
    client.on('user-left', handleUserLeft)

    joinStream();
}
let joinStream = async () => {
    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks()
    let player = `<div class="video__container" id="user-container-${uid}">
                        <div class="video-player" id="user-${uid}"></div> 
                    </div>` //${displayName}
    document.getElementById('streams__container').insertAdjacentHTML('beforeend', player)

    // localTracks[0] //audio track store here
    localTracks[1].play(`user-${uid}`) //video track store here
    // console.log("some details -->"+localTracks)
    await client.publish([localTracks[0],localTracks[1]])
}

let handleUserPublished = async (user, mediaType) => {
    remoteUsers[user.uid] = user

    await client.subscribe(user, mediaType)

    let player = document.getElementById(`user-container-${user.uid}`)
    if(player===null){
        player = `<div class="video__container" id="user-container-${user.uid}">
                            <div class="video-player" id="user-${user.uid}"></div> 
                        </div>`
        document.getElementById('streams__container').insertAdjacentHTML('beforeend', player)
    }

    if(mediaType === 'video'){
        user.videoTrack.play(`user-${user.uid}`)
    }
    if(mediaType === 'audio'){
        user.audioTrack.play()
    }

}

let handleUserLeft = async (user)=>{
    delete remoteUsers[user.uid]
    document.getElementById(`user-container-${user.uid}`).remove()
}

joinRoomInit()