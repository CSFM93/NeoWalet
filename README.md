## Inspiration
After seeing many banks implementing their own chatbot wallet I decided to do the same but with the power of blockchain.


## What it does
In this project, I  built a Neo chatbot wallet for Telegram, Whatsapp, and Discord. For simplicity, the wallet will be called Neo Wallet. I will not only build the wallet but I will also write tutorials that will teach people how to use Node js, Neon.js, and Neo smart contracts to build a chatbot on the platforms mentioned above. At the end of each tutorial, the user will have a neo chatbot wallet capable of creating Neo accounts, adding existing Neo Accounts, checking balance, and sending and receiving neo. Since the platforms mentioned above combined have billions of users having a wallet for each will increase the adoption of Neo. The tutorials will be published after the hackathon. 


## Testing instructions
Available in devpost .



## How we built it
I used Node.js, Express.js, and Socket.io to build the authentication system to avoid sharing sensitive data on Telegram and other platforms.
For the Telegram chatbot, I used a library called `telegraf`, for the Discord chatbot I used a library called `discord.js`, and for Whatsapp I used `twilio`. All three bots rely on the `Neon.js` library to perform wallet operations. We are storing the users' data in a `JSON` file in the server. Each Platform has its own folder where the users' wallets are stored and each user has his own `JSON` file. Neo wallet was built with both single and multiple users in mind.


### Login
When the user wants to use the wallet on the social messaging app of his choice he has to first log in to his Neo wallet by first sending the `/start` command followed by the `/login`. After invoking the `/login` command the user will be presented with an URL that will allow him to log in to his Neo Wallet. The URL should look like the following: `https://neowallet.me/login.html?userId=258847592611&platform=whatsapp`. The user should have his own domain and vps , the `neowallet.me` was only created for this hackathon. The URL contains the `userID` and the `platform` where is trying to use his Neo wallet. The user will have to click this URL and enter the password he set his `.env` file in the server.

### Adding Neo account
When the user wants to add an existing Neo account to Neo Wallet he will have to send the `/addAccount` command. After invoking the `/addAccount` the user will be presented with an URL that looks similar to the following: `https://neowallet.me/addAccount.html?userId=258847592611&platform=telegram`. The URL contains the `userID` and the `platform` where is trying to use his Neo wallet. The user will have to insert an existing Neo account WIF in order to add it to Neo Wallet.

## Saving addresses
Neo wallet saves address in a smart contract private storage with the hash:`0x92913c72887189a438ef447335eb6ccc7150409f`. The smart contract was written using `c#` and it enables uses to use human readable addresses instead of long ones. The smart contract allows users to take a long neo address like `NRBHB9hbEwhYXHtZ8LraHzQYQN4vQHroWN` and turn it into something friendly like `sam`.


## Challenges we ran into
At the beginning of the hackathon I wanted to write the smart contracts using python because that's my go-to language when I need to build something fast, however, I soon found out that I wouldn't be able to do what I wanted to do with python because the libraries aren't there yet since Neo3 is quite new. So after that, I did some research and realized that I would be able to do what I wanted if used c# to write smart contracts, even though I don't have much experience with c# I decided to give it a go, and fortunately, it worked.
It was difficult to build 2 projects (Neo cloud and Neo wallet) in just one month as single person Team.


## Accomplishments that we're proud of
I am proud that I was able to finish two large projects as a single-person team in just one month.


## What we learned
While building the Neo cloud platform I had to learn the following:
- How to write and update smart contracts using c# ;
- How to perform CRUD operations on a smart contract private storage;
- How to film, and edit a project video demo.


## What's next for Neo wallets for Telegram, Whatsapp, FB Messenger, Discord
After the hackathon, I will write a series of tutorials teaching users how to to build their own Neo wallet.


## Special thanks
I wouldn't be able to finish this project in such a short amount of time if it wasn't for:
- https://neo.org/ tutorials and documentation
- https://dojo.coz.io/ tutorials
- https://github.com/CityOfZion/neon-js Javascript libraries
- https://neospcc.medium.com/ NeoFs tutorials
- Joe Stewart, known online as Hal0x2328 for helping me when I was stuck on Discord.
