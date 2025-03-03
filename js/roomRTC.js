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

let displayName= sessionStorage.getItem('display_name')
if(!displayName){
    window.location = 'lobby.html'
}

let localTracks = []
let remoteUsers = {}

let localScreenTrack;
let sharingScreen = false;

let joinRoomInit = async () => {
    // codec is an encoding method used by browser
    client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" })
    await client.join(APP_ID, roomId, token, uid)

    client.on('user-published', handleUserPublished)
    client.on('user-left', handleUserLeft)

    joinStream();
}
let joinStream = async () => {
    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks({},{encoderConfig:{
        width: {min: 640, ideal:1920, max: 1920},
        height: {min: 480, ideal:720, max: 1080},
    } })
    let player = `<div class="video__container" id="user-container-${uid}">
                        <div class="video-player" id="user-${uid}"></div> 
                    </div>` //${displayName}
    document.getElementById('streams__container').insertAdjacentHTML('beforeend', player)

    document.getElementById(`user-container-${uid}`).addEventListener('click', expendVideoFrame)

    // localTracks[0] //audio track store here
    localTracks[1].play(`user-${uid}`) //video track store here
    // console.log("some details -->"+localTracks)
    await client.publish([localTracks[0], localTracks[1]])
}

let switchToCamera = async () =>{
    let player = `<div class="video__container" id="user-container-${uid}">
                            <div class="video-player" id="user-${uid}"></div> 
                        </div>`
    displayFrame.insertAdjacentHTML('beforeend', player)

    // await localTracks[0].setMuted(true)
    await localTracks[1].setMuted(true)

    // document.getElementById(`mic-btn`).classList.remove('active')
    document.getElementById(`camera-btn`).classList.remove('active')

    localTracks[1].play(`user-${uid}`)
    await client.publish([localTracks[1]])

}

let handleUserPublished = async (user, mediaType) => {
    remoteUsers[user.uid] = user

    await client.subscribe(user, mediaType)

    let player = document.getElementById(`user-container-${user.uid}`)
    if (player === null) {
        player = `<div class="video__container" id="user-container-${user.uid}">
                            <div class="video-player" id="user-${user.uid}"></div> 
                        </div>`
        document.getElementById('streams__container').insertAdjacentHTML('beforeend', player)
        document.getElementById(`user-container-${user.uid}`).addEventListener('click', expendVideoFrame)

    }
    if (displayFrame.style.display) {
        let videFrame=document.getElementById(`user-container-${user.uid}`)
        videFrame.style.height = '100px'
        videFrame.style.width = '100px'
    }

    if (mediaType === 'video') {
        user.videoTrack.play(`user-${user.uid}`)
    }
    if (mediaType === 'audio') {
        user.audioTrack.play()
    }

}

let handleUserLeft = async (user) => {
    delete remoteUsers[user.uid]
    document.getElementById(`user-container-${user.uid}`).remove()

    if (userIdInDisplayFrame === `user-container-${user.uid}`) {
        displayFrame.style.display = 'none'
        let videoFrames = document.getElementsByClassName('video__container')
        for (let i = 0; i < videoFrames.length; i++) {
            videoFrames[i].style.height='300px';
            videoFrames[i].style.width='300px';
            
        }

    }
}

let toggleCamera= async(e)=>{
    let button=e.currentTarget;

    if(localTracks[1].muted){
        await localTracks[1].setMuted(false)
        button.classList.add('active')
    }
    else{
        await localTracks[1].setMuted(true)
        button.classList.remove('active')
    }
}
let toggleMic= async(e)=>{
    let button=e.currentTarget;

    if(localTracks[0].muted){
        await localTracks[0].setMuted(false)
        button.classList.add('active')
    }
    else{
        await localTracks[0].setMuted(true)
        button.classList.remove('active')
    }
}

let toggleScreen=async(e)=>{
    let screenButton=e.currentTarget;
    let cameraButton=document.getElementById('camera-btn');

    if(!sharingScreen){
        sharingScreen=true;
        screenButton.classList.add('active');
        cameraButton.classList.add('inactive');
        cameraButton.style.display='none';

        localScreenTrack=await AgoraRTC.createScreenVideoTrack();

        document.getElementById(`user-container-${uid}`).remove();


        let player = `<div class="video__container" id="user-container-${uid}">
                            <div class="video-player" id="user-${uid}"></div> 
                        </div>`
        displayFrame.insertAdjacentHTML('beforeend', player)
        document.getElementById(`user-container-${uid}`).addEventListener('click',expendVideoFrame)
        
        userIdInDisplayFrame=`user-container-${uid}`;
        localScreenTrack.play(`user-${uid}`);

        await client.unpublish([localTracks[1]])
        await client.publish([localScreenTrack])

        let videoFrames = document.getElementsByClassName('video__container')

        for (let i = 0; i < videoFrames.length; i++) {
            if (videoFrames[i].id != userIdInDisplayFrame) {
              videoFrames[i].style.height = '100px';
              videoFrames[i].style.width = '100px';
            }
        
          }
    }
    else{
        sharingScreen=false;
        cameraButton.style.display='block';

        document.getElementById(`screen-btn`).classList.remove('active')


        document.getElementById(`user-container-${uid}`).remove();
        await client.unpublish([localScreenTrack])

        switchToCamera();
    }
}

document.getElementById('camera-btn').addEventListener('click',toggleCamera)
document.getElementById('mic-btn').addEventListener('click',toggleMic)
document.getElementById('screen-btn').addEventListener('click',toggleScreen)

joinRoomInit()