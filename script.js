let jsmediatags = window.jsmediatags;
let songIndex = 0;
let songs = [];

$(document).ready(function() {
    const audio = document.getElementById('audio');

    $('#prev').click(prevSong);
    $('#next').click(nextSong);
    
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', nextSong);
    
    $('#progress-container').click(setProgress);

    $('#audio-input').change(chooseSongs);

    $('#shuffle').click(shuffle);

    $('body').on('click', '.playlist-track-ctn', function() {
        const index = +$(this).attr('data-index');
        if(songIndex !== index) {
            songIndex = index;
            // make song active in localstorage
            songs = songs.map((song, index) => {
                song.active =  index === songIndex ? true : false;
                return song;
            });
    
            loadSong(songs[songIndex]);
    
            playSong();
        } else {
            const isPlaying = $('#music-container').hasClass('play');
            if (isPlaying) {
                pauseSong();
            } else {
                playSong();
            }
        }
    });

    $('#play').click('click', function() {
        const isPlaying = $('#music-container').hasClass('play');
        if (isPlaying) {
            pauseSong();
        } else {
            playSong();
        }
    });
    
    $("#volume").slider({
        min: 0,
        max: 100,
        value: 100,
        range: "min",
        slide: function (event, ui) {
            setVolume(ui.value / 100);
        }
    });
});

async function chooseSongs() {
    const oldSongs = songs.length;

    const files = this.files;
    let newSongs = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const mediaData = await getMediaData(file, i);
        newSongs.push(mediaData);
    }

    songs = [...songs, ...newSongs]
    
    if(oldSongs === 0) loadSong(songs[songIndex]);
    
    await addSongsToList(oldSongs);

    playSong();
}

function getMediaData(file, index) {
    return new Promise(function (resolve, reject) {
        jsmediatags.read(file, {
            onSuccess: function (tag) {
                const image = tag.tags.picture;
                let base64 = null;

                if (image) {
                    let base64String = "";
                    for (let i = 0; i < image.data.length; i++) {
                        base64String += String.fromCharCode(image.data[i]);
                    }
                    base64 = "data:" + image.format + ";base64," + window.btoa(base64String);
                }

                const returnData = {
                    title: tag.tags.title,
                    album: tag.tags.album,
                    artist: tag.tags.artist,
                    genre: tag.tags.genre,
                    picture: base64,
                    fileUrl: URL.createObjectURL(file),
                    active: songs.length === 0 && index === 0 ? true : false 
                }

                resolve(returnData);
            },
            onError: function (error) {
                console.log(error);
            }
        });
    });
}

function loadSong(song) {
    title.innerText = song.title;
    audio.src = song.fileUrl;
    cover.setAttribute('src', song.picture);
}

function playSong() {
    if($('.playlist-ctn').children().length === 0) {
        alert('Please add songs');
        return false;
    }

    $('#music-container').addClass('play');
    $('#play').children().removeClass('fa-play');
    $('#play').children().addClass('fa-pause');

    // set list play icon
    const activeSongIndex = songs.findIndex(song => song.active);
    $(`#pbp-${activeSongIndex}`).html(`<i class="fas fa-pause" height="40" width="40" id="p-img-${activeSongIndex}" aria-hidden="true"></i>`);

    audio.play();
}

const pauseSong = () => {
    $('#music-container').removeClass('play');
    $('#play').children().addClass('fa-play');
    $('#play').children().removeClass('fa-pause');

    const activeSongIndex = songs.findIndex(song => song.active);
    $(`#pbp-${activeSongIndex}`).html(`<i class="fas fa-play" height="40" width="40" id="p-img-${activeSongIndex}" aria-hidden="true"></i>`);

    audio.pause();
}

async function prevSong() {
    if($('.playlist-ctn').children().length === 0) {
        alert('Please add songs');
        return false;
    }

    songIndex--;

    if (songIndex < 0) {
        songIndex = songs.length - 1;
    }

    // make song active in localstorage
    songs = songs.map((song, index) => {
        song.active =  index === songIndex ? true : false;
        return song;
    });

    loadSong(songs[songIndex]);

    playSong();
}

async function nextSong() {
    if($('.playlist-ctn').children().length === 0) {
        alert('Please add songs');
        return false;
    }

    songIndex++;

    if (songIndex > songs.length - 1) {
        songIndex = 0;
    }

    // make song active in localstorage
    songs = songs.map((song, index) => {
        song.active =  index === songIndex ? true : false;
        return song;
    });

    loadSong(songs[songIndex]);

    playSong();
}

function updateProgress(e) {
    const { duration, currentTime } = e.srcElement;
    const progressPercent = (currentTime / duration) * 100;
    progress.style.width = `${progressPercent}%`;
}

function setProgress(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;

    audio.currentTime = (clickX / width) * duration;
}

function setVolume(volume) {
    const audio = $('#audio').get(0);
    
    if(volume < 1) {
        $('#volume-btn').html('<i class="fa fa-volume-down"></i>');
    }

    if(volume === 1) {
        $('#volume-btn').html('<i class="fa fa-volume-up"></i>');
    }

    if(volume === 0) {
        $('#volume-btn').html('<i class="fa fa-volume-mute"></i>');
    }
    
    audio.volume = volume;
}

function addSongsToList(oldSongs) {
    return new Promise((resolve, reject) => {
        const audio = document.getElementById('audio');

        if(oldSongs === 0) {
            audio.addEventListener('loadedmetadata', function(){
                const duration = audio.duration;
        
                // Get Minutes
                let mins = Math.floor((duration % (60 * 60)) / 60);
                if (mins < 10) {
                    mins = '0' + String(mins);
                }
        
                // Get Seconds
                let secs = Math.floor(duration % 60);
                if (secs < 10) {
                    secs = '0' + String(secs);
                }
        
                songHtml = songs.map((song, index) => {
                    return `<div class="playlist-track-ctn ${song.active ? 'active-track' : ''}" id="ptc-${index}" data-index="${index}">
                                <div class="playlist-btn-play" id="pbp-${index}"><i class="fas ${song.active ? 'fa-pause' : 'fa-play'}" height="40" width="40" id="p-img-${index}" aria-hidden="true"></i></div>
                                <div class="playlist-info-track">${song.title}</div>
                                <div class="playlist-duration">${song.active ? `${mins}:${secs}` : ''}</div>
                            </div>`
                }).join('');
            
                $('.playlist-ctn').html(songHtml);
    
                resolve();
            },false);
        } else {
            songHtml = songs.map((song, index) => {
                return `<div class="playlist-track-ctn ${song.active ? 'active-track' : ''}" id="ptc-${index}" data-index="${index}">
                            <div class="playlist-btn-play" id="pbp-${index}"><i class="fas ${song.active ? 'fa-pause' : 'fa-play'}" height="40" width="40" id="p-img-${index}" aria-hidden="true"></i></div>
                            <div class="playlist-info-track">${song.title}</div>
                            <div class="playlist-duration"></div>
                        </div>`
            }).join('');
        
            $('.playlist-ctn').html(songHtml);

            resolve();
        }
    
    });
}

function shuffle() {
    if($('.playlist-ctn').children().length === 0) {
        alert('Please add songs');
        return false;
    }

    let currentIndex = songs.length, temporaryValue, randomIndex;
  
    while (0 !== currentIndex) { 
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      // And swap it with the current element.
      temporaryValue = songs[currentIndex];
      songs[currentIndex] = songs[randomIndex];
      songs[randomIndex] = temporaryValue;
    }

    songHtml = songs.map((song, index) => {
        return `<div class="playlist-track-ctn ${song.active ? 'active-track' : ''}" id="ptc-${index}" data-index="${index}">
                    <div class="playlist-btn-play" id="pbp-${index}"><i class="fas ${song.active ? 'fa-pause' : 'fa-play'}" height="40" width="40" id="p-img-${index}" aria-hidden="true"></i></div>
                    <div class="playlist-info-track">${song.title}</div>
                    <div class="playlist-duration"></div>
                </div>`
    }).join('');

    $('.playlist-ctn').html(songHtml);
}