// This is a utility function that we run with node-cron, on a 10-minute
// interval.
//
// It refreshes the database entries associated with our demo account
//
// The rationale here is that (conceivably), someone could vandalize our
// demo account. Our cron job ensures that the demo account is refreshed,
// periodically.
//
// A "better" (safer) strategy might be to generate unique demo accounts, based
// on IP, and then have a nightly cron job to delete them. This is good enough,
// for now, though.

const { http } = require('http');
const request = require('request-promise');
const mongoose = require('mongoose');

const { UserAccount, Entry } = require('../api');
const [ UserAccounts, Entries ] = [ UserAccount, Entry ];
const { PORT, DATABASE_URL } = require('../config');

const username = 'demo_account';
const password = 'abc123';

function dropDemoAccount() {
    // Deletes our demo_account. We're skipping the endpoint, on the off chance
    // someone malicious has changed the password
    //
    // Subordinate function
    console.log('[bin/demo_account_refresh] :: Dropping `demo_account`');
    return Promise.all([ Entries.remove({ author: username }).exec(),
                         UserAccounts.remove({ username: username }).exec() ]);
}

function createDemoAccount() {
    // Subordinate function
    return request({
        method: 'POST',
        url: `http://localhost:${PORT}/api/user_account`,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
    });
}

function postPost(jwt, post) {
    // Subordinate function
    return request({
        method: 'POST',
        url: `http://localhost:${PORT}/api/entries`,
        headers: {
            Authorization: 'Bearer '+ JSON.parse(jwt),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(post),
    });
}

function resetDemoAccount() {
    // The function we actually call (with cron)
    // - Drops demo_account record
    // - POSTs a new demo_account
    // - POSTs the collection of posts in `data`
    //
    // Main function
    return dropDemoAccount()
        .then(createDemoAccount)
        .then(jwt => {
            console.log('[bin/demo_account_refresh] :: Creating posts for `demo_account`...');
            console.log(jwt);
            for (let post of data)
                // Issues a POST for every entry in our `data`, below
                postPost(jwt, post);
        })
        .then(() => console.log('[bin/demo_account_refresh] :: `demo_account` refreshed!'))
        .catch(err => console.log('[bin/demo_account_refresh] :: '+ err));
}

module.exports = { resetDemoAccount };


//////////////////////////////////
//////////////////////////////////
//////////////////////////////////
//////////////////////////////////
//////////////////////////////////
//////////////////////////////////
//////////////////////////////////
//////////////////////////////////
//////////////////////////////////
//////////////////////////////////
//////////////////////////////////
//////////////////////////////////
//////////////////////////////////
//////////////////////////////////
//////////////////////////////////
//////////////////////////////////
//////////////////////////////////
//////////////////////////////////
// DATA GO HERE //////////////////
//////////////////////////////////
//////////////////////////////////
//////////////////////////////////
//////////////////////////////////
//////////////////////////////////
//////////////////////////////////
//////////////////////////////////
//////////////////////////////////
//////////////////////////////////
//////////////////////////////////
//////////////////////////////////
//////////////////////////////////
// \/ \/ \/ \/ \/ \/ \/ \/ \/ \///






const data = [
    {title: `Music`, body: `Music is a form of art. Music is also a form of entertainment that puts sounds together in a way that people like or find interesting. Most music includes people singing with their voices or playing musical instruments, such as the piano, guitar, or drums.

The word music comes from the Greek word μουσική (mousike), which means "(art) of the Muses". In Ancient Greece the Muses included the goddesses of music, poetry, art, and dance. Someone who makes music is known as a musician.

Music is sound that has been organized by using rhythm, melody or harmony. If someone bangs saucepans while cooking, it makes noise. If a person bangs saucepans or pots in a rhythmic way, they are making a simple type of music.

There are four things which music has most of the time:

Music often has pitch. This means high and low notes. Tunes are made of notes that go up or down or stay on the same pitch.
Music often has rhythm. Rhythm is the way the musical sounds and silences are put together in a sequence. Every tune has a rhythm that can be tapped. Music usually has a regular beat.
Music often has dynamics. This means whether it is quiet or loud or somewhere in between.
Music often has timbre. This is a French word (pronounced the French way: "TAM-br"). The "timbre" of a sound is the way that a sound is interesting. The sort of sound might be harsh, gentle, dry, warm, or something else. Timbre is what makes a clarinet sound different from an oboe, and what makes one person's voice sound different from another person.
`},
    {title: `Music definition`, body: `
There is no simple definition of music which covers all cases. It is an art form, and opinions come into play. Music is whatever people think is music. A different approach is to list the qualities music must have, such as, sound which has rhythm, melody, pitch, timbre, etc.

These and other attempts, do not capture all aspects of music, or leave out examples which definitely are music. According to Thomas Clifton, music is "a certain reciprocal relation established between a person, his behavior, and a sounding object". Musical experience and the music, together, are called phenomena, and the activity of describing phenomena is called phenomenology.

`},
    {title: `History of Music`, body: `Even in the stone age people made music. The first music was probably made trying to imitate sounds and rhythms that occurred naturally. Human music may echo these phenomena using patterns, repetition and tonality. This kind of music is still here today. Shamans sometimes imitate sounds that are heard in nature. It may also serve as entertainment (games), or have practical uses, like luring animals when hunting.

Some animals also can use music. Songbirds use song to protect their territory, or to attract a mate. Monkeys have been seen beating hollow logs. This may, of course, also serve to defend the territory.

The first musical instrument used by humans was probably the voice. The human voice can make many different kinds of sounds. The larynx (voice box) is like a wind instrument.

The oldest known Neanderthal hyoid bone with the modern human form was found in 1983, indicating that the Neanderthals had language, because the hyoid supports the voice box in the human throat.

Most likely the first rhythm instruments or percussion instruments involved the clapping of hands, stones hit together, or other things that are useful to keep a beat. There are finds of this type that date back to the paleolithic. Some of these are ambiguous, as they can be used either as a tool or a musical instrument.

`},
    {title: `Baroque Music`, body: `In the arts, the Baroque was a Western cultural era, which began near the turn of the 17th century in Rome. It was exemplified by drama and grandeur in sculpture, painting, literature, dance, and music. In music, the term 'Baroque' applies to the final period of dominance of imitative counterpoint, where different voices and instruments echo each other but at different pitches, sometimes inverting the echo, and even reversing thematic material.

The popularity and success of the Baroque style was encouraged by the Roman Catholic Church which had decided at the time of the Council of Trent that the arts should communicate religious themes in direct and emotional involvement. The upper class also saw the dramatic style of Baroque architecture and art as a means of impressing visitors and expressing triumphant power and control. Baroque palaces are built around an entrance of courts, grand staircases and reception rooms of sequentially increasing opulence. In similar profusions of detail, art, music, architecture, and literature inspired each other in the Baroque cultural movement as artists explored what they could create from repeated and varied patterns. Some traits and aspects of Baroque paintings that differentiate this style from others are the abundant amount of details, often bright polychromy, less realistic faces of subjects, and an overall sense of awe, which was one of the goals in Baroque art.

The word baroque probably derives from the ancient Portuguese noun "barroco" which is a pearl that is not round but of unpredictable and elaborate shape. Hence, in informal usage, the word baroque can simply mean that something is "elaborate", with many details, without reference to the Baroque styles of the seventeenth and eighteenth centuries.

`},
    {title: `Musical instrument`, body: `Musical instruments are things used to make music. Anything that somehow produces sound can be considered a musical instrument, but the term generally means items that are specifically for making music.

Musical instruments can be divided by type into:

* strings (plucked or bowed)
* woodwind
* brass
* percussion
* keyboard instruments
* An orchestra has instruments from four families:

* bowed string instruments (e.g. violin)
* woodwind (e.g. flute)
* brass (e.g. trumpet)
* percussion (e.g. drums)
Some people think that the voice is a "natural musical instrument" because singing is a way to make music without any instrument at all.

`},
    {title: `Pop music`, body: `Pop music came from the Rock and Roll movement of the early 1950s, when record companies recorded songs that they thought that teenagers would like. Pop music usually uses musical from the other types of music that are popular at the time. Many different styles of music have become pop music during different time periods. Often, music companies create pop music styles by taking a style of music that only a small number of people were listening to, and then making that music more popular by marketing it to teenagers and young adults.

In the 1950s, recording companies took blues-influenced rock and roll (for example Chuck Berry and Bo Diddley) and rockabilly (for example Carl Perkins and Buddy Holly) and promoted them as pop music. In the late 1960s and early 1970s, record companies took folk music bands and musicians and helped them to create a new type of music called folk rock or acid rock. Folk rock and acid rock mixed folk music, blues and rock and roll (for example The Byrds and Janis Joplin). In the 1970s, record companies created several harder, louder type of blues called blues rock or heavy metal, which became a type of pop music (for example the bands Led Zeppelin and Judas Priest).

In the late 1970s and early 1980s, a type of nightclub dance music called Disco turned into a popular type of pop music. Record companies took an experimental, strange-sounding type of music called New Wave music from the 1980s and turned it into pop music bands such as The Cars. In the 1990s record companies took an underground type of hard rock called Grunge (for example the band Nirvana). Michael Jackson was also a very influential artist for pop music. His album, Thriller, is the best-selling album of all time. He also wrote some other very influential songs, such as "Bad", "Give In to Me", "Will You Be There", "Heal the World", "We Are the World", "Black or White", and "Billie Jean", just to name a few. By the 21st century (after the demise of disco in the 1980s) Contemporary R&B became pop music. Examples of Contemporary R&B artists that have a wide pop appeal are Usher, Beyoncé, Rihanna, Chris Brown and more.

`},
    {title: `Orchestra`, body: `An orchestra is a group of musicians playing instruments together. They usually play classical music. A large orchestra is sometimes called a "symphony orchestra" and a small orchestra is called a "chamber orchestra". A symphony orchestra may have about 100 players, while a chamber orchestra may have 30 or 40 players. The number of players will depend on what music they are playing and the size of the place where they are playing. The word "orchestra" originally meant the semi-circular space in front of a stage in a Greek theatre which is where the singers and instruments used to play. Gradually the word came to mean the musicians themselves.

The orchestra is directed by a conductor. He/she helps the players to play together, to get the right balance so that everything can be heard clearly, and to encourage the orchestra to play with the same kind of feeling. Some small chamber orchestras may play without a conductor. This was usual until the 19th century when the orchestras got very big and needed a conductor who made decisions and stood in front so that all the players could see him.
`},
];
