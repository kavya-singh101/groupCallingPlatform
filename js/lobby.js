let form = document.getElementById('lobby__form')

let displayName= localStorage.getItem('display_name')
// let displayName= sessionStorage.getItem('display_name')
if(displayName){
    form.name.value=displayName
}

const queryS = window.location.search
const urlPara = new URLSearchParams(queryS)
let id_ = urlPara.get('id')


if(id_!==null || id_!==undefined || id_!==""){
    form.room.value=id_;
}


form.addEventListener('submit',(e)=>{
    e.preventDefault();

    localStorage.setItem('display_name',e.target.name.value)
    // sessionStorage.setItem('display_name',e.target.name.value)

    let inviteCode = e.target.room.value;
    if(!inviteCode){
        inviteCode = Math.floor(Math.random()*10000)
    }

    window.location= `room.html?room=${inviteCode}`
})