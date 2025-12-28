// Stream Manager Class

export default class {
  streamsRefCnt = {}
  gameAPI = {}

  constructor(api) {
    this.gameAPI = api
  }

  // C++ does not need to know our internal reference count, so we filter it out here
  _updateSubscriptions() {
    let reqVehStreams = []
    for (let k in this.streamsRefCnt) {
      reqVehStreams.push(k)
    }
    let subscriptions = {
      vehicles: [{ byPlayerId: 0, streams: reqVehStreams }],
      //globalStreams: [] // TODO:
    }
    this.gameAPI.subscribeToEvents(JSON.stringify(subscriptions))
  }

  add(streams) {
    for (let i = 0; i < streams.length; ++i) {
      let stream = streams[i]
      if (!this.streamsRefCnt[stream]) this.streamsRefCnt[stream] = 0
      this.streamsRefCnt[stream] += 1
    }
    this._updateSubscriptions()
  }

  remove(streams) {
    for (let i = 0; i < streams.length; ++i) {
      let stream = streams[i]
      if (this.streamsRefCnt[stream]) {
        this.streamsRefCnt[stream] -= 1
        if (this.streamsRefCnt[stream] <= 0) {
          delete this.streamsRefCnt[stream]
        }
      }
    }
    this._updateSubscriptions()
  }

  reset() {
    this.streamsRefCnt = {}
    this._updateSubscriptions()
  }

  resubmit() {
    this._updateSubscriptions()
  }
}
