import { Farmbot } from 'farmbot'

const SUPER_SECRET_TOKEN = 'see .env file FARMBOT_JS_SUPER_SECRET_TOKEN'

const bot = new Farmbot({ token: SUPER_SECRET_TOKEN })

bot
  .connect()
  .then(() => {
    // alert("MARTY: HEY HEY HEY")
    // bot.setConfig("MARTY", "HEY HEY HEY")
    // console.log(bot.getConfig("MARTY"))
    // return bot.getConfig("MARTY")
    console.debug('[MM] HEY HEY HEY -- FARMBOT INITIATED.')
  })
  .then(() =>
    bot.moveRelative({
      x: 1,
      y: 2,
      z: 3,
      speed: 100,
    })
  )

console.debug('bot', bot)

const FarmbotComponent = (): JSX.Element => {
  const word = '[MM] FARMBOT HEY HEY HEY'
  return <div>Farmbot: {word}</div>
}

export default FarmbotComponent
