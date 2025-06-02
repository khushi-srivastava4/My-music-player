// Wrap everything in an IIFE (Immediately Invoked Function Expression) to prevent global scope pollution
(function() {
    let currentSong = new Audio();
    let songs = [];
    let currfolder;

    function secondsToMinutesSeconds(seconds) {
        if (isNaN(seconds) || seconds < 0) {
            return "00:00";
        }

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);

        const formattedMinutes = String(minutes).padStart(2, '0');
        const formattedSeconds = String(remainingSeconds).padStart(2, '0');

        return `${formattedMinutes}:${formattedSeconds}`;
    }

    async function getSongs(folder) {
        try {
            currfolder = folder;
            let a = await fetch(`${folder}/`)
            if (!a.ok) {
                throw new Error(`HTTP error! status: ${a.status}`);
            }
            let response = await a.text();
            let div = document.createElement("div")
            div.innerHTML = response;
            let as = div.getElementsByTagName("a")
            songs = []
            for (let index = 0; index < as.length; index++) {
                const element = as[index];
                if (element.href.endsWith(".mp3")) {
                    songs.push(element.href.split(`${folder}/`)[1])
                }
            }

            // Update only the libraryList
            let libraryUL = document.querySelector(".libraryList").getElementsByTagName("ul")[0]
            
            // Clear the library list
            libraryUL.innerHTML = ""
            
            // Create song HTML for library list
            for (const song of songs) {
                const songHTML = `<li>
                    <img class="invert" width="34" src="music.svg" alt="">
                    <div class="info">
                        <div>${song.replaceAll("%20", " ")}</div>
                        <div>Khushi</div>
                    </div>
                    <div class="playnow">
                        <span>Play Now</span>
                        <img class="invert" src="play.svg" alt="">
                    </div>
                </li>`;
                
                libraryUL.innerHTML += songHTML;
            }
            
            // Add click event listeners to library list
            Array.from(libraryUL.getElementsByTagName("li")).forEach(e => {
                e.addEventListener("click", element => {
                    playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim())
                })
            })
            
            return songs
        } catch (error) {
            console.error("Error loading songs:", error);
            return [];
        }
    }

    const playMusic = (track, pause=false) => {
        currentSong.src = `${currfolder}/` + track
        if(!pause){
            currentSong.play()
            document.querySelector("#play").src = "pause.svg"
        }
        
        document.querySelector(".songinfo").innerHTML = decodeURI(track)
        document.querySelector(".songtime").innerHTML = "00:00 / 00:00"
    }

    async function displayAlbums() {
        try {
            console.log("displaying albums")
            let a = await fetch(`songs/`)
            if (!a.ok) {
                throw new Error(`HTTP error! status: ${a.status}`);
            }
            let response = await a.text();
            let div = document.createElement("div")
            div.innerHTML = response;
            let anchors = div.getElementsByTagName("a")
            let cardContainer = document.querySelector(".card-container")
            if (!cardContainer) {
                throw new Error("Card container not found in the DOM");
            }
            
            let array = Array.from(anchors)
            for (let index = 0; index < array.length; index++) {
                const e = array[index]; 
                if (e.href.includes("/songs") && !e.href.includes(".htaccess")) {
                    let folder = e.href.split("/").slice(-2)[0]
                    try {
                        // Get the metadata of the folder
                        let a = await fetch(`songs/${folder}/info.json`)
                        if (!a.ok) {
                            throw new Error(`HTTP error! status: ${a.status}`);
                        }
                        let response = await a.json(); 
                        cardContainer.innerHTML = cardContainer.innerHTML + ` <div data-folder="${folder}" class="card">
                            <div class="play">
                                <img src="play.svg" alt="">
                            </div>
                            <img src="card1.png" alt="">
                            <h2>${response.title}</h2>
                            <p>${response.description}</p>
                        </div>`
                    } catch (error) {
                        console.error(`Error loading info for folder ${folder}:`, error);
                    }
                }
            }

            //load playlist and update both lists when a card is clicked
            Array.from(document.getElementsByClassName("card")).forEach(e=>{
                e.addEventListener("click",async item=>{
                    songs = await getSongs(`songs/${e.dataset.folder}`)
                    if (songs.length > 0) {
                        playMusic(songs[0], true)
                    }
                })
            })
        } catch (error) {
            console.error("Error displaying albums:", error);
        }
    }

    async function main() {
        await getSongs("songs/Mood1")
        playMusic(songs[0], true)
        await displayAlbums()

        //play and pause
        const playButton = document.querySelector("#play")
        if (playButton) {
            playButton.addEventListener("click", () => {
                if(currentSong.paused){
                    currentSong.play()
                    playButton.src = "pause.svg"
                }
                else{
                    currentSong.pause()
                    playButton.src = "play.svg"
                }
            })
        }

        //Time update
        currentSong.addEventListener("timeupdate", () => {
            document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`
            document.querySelector(".circle").style.left = (currentSong.currentTime/ currentSong.duration)*100 + "%";
        })

        //seekbar
        const seekbar = document.querySelector(".seekbar")
        if (seekbar) {
            seekbar.addEventListener("click", e => {
                let percent = e.offsetX/e.target.getBoundingClientRect().width*100
                document.querySelector(".circle").style.left = percent + "%"
                currentSong.currentTime = (currentSong.duration*percent)/100
            })
        }

        // Add an event listener for hamburger
        const hamburger = document.querySelector(".hamburger")
        if (hamburger) {
            hamburger.addEventListener("click", () => {
                document.querySelector(".left").style.left = "0"
            })
        }

        // Add an event listener for close button
        const close = document.querySelector(".close")
        if (close) {
            close.addEventListener("click", () => {
                document.querySelector(".left").style.left = "-120%"
            })
        }

        //prev
        const prev = document.querySelector("#prev")
        if (prev) {
            prev.addEventListener("click", () => {
                currentSong.pause()
                let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0])
                if(index-1 >= 0)
                    playMusic(songs[index-1])
            })
        }

        //next
        const next = document.querySelector("#next")
        if (next) {
            next.addEventListener("click", () => {
                currentSong.pause()
                let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0])
                if(index+1 < songs.length)
                    playMusic(songs[index+1])
            })
        }

        //volume event
        const volumeInput = document.querySelector(".range input")
        if (volumeInput) {
            volumeInput.addEventListener("change", (e) => {
                currentSong.volume = parseInt(e.target.value) / 100;
            })
        }

        //mute the track
        const volumeImg = document.querySelector(".volume>img")
        if (volumeImg) {
            volumeImg.addEventListener("click", e => { 
                if(e.target.src.includes("volume.svg")){
                    e.target.src = e.target.src.replace("volume.svg", "mute.svg")
                    currentSong.volume = 0;
                    document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
                }
                else{
                    e.target.src = e.target.src.replace("mute.svg", "volume.svg")
                    currentSong.volume = .10;
                    document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
                }
            })
        }
    }

    // Initialize when DOM is loaded
    document.addEventListener('DOMContentLoaded', main);
})();