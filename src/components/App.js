import React, { Component } from 'react';
import nft from '../nft.png';
import './App.css';
import Web3 from 'web3';
import ConsensusQuizNft from "../abis/ConsensusQuizNFT.json"

const CONTRACT_ADDRESS = "0x3310a4Bcd051EcdBFf67d3907aF8199D7C9399f7"

const { create } = require('ipfs-http-client')

const client = create({
  host: "ipfs.infura.io",
  port: "5001",
  protocol: "https",
});

console.log(client)

class App extends Component {

  constructor(props){
    super(props)
    this.state = {
      "account": "",
      "buffer":null,
      "networkId":"",
      "connected":false,
      "contract":null
    }
  }

  captureFile = (event) => {
    event.preventDefault()
    const file = event.target.files[0]
    const reader = new window.FileReader()
    reader.readAsArrayBuffer(file)
    reader.onloadend = () => {
      this.setState({
        "buffer":Buffer(reader.result)
      })
    }
  }

   submitFormData = async (event) => {
    event.preventDefault()
    window.alert("Wait while your transaction is being processed. You will be redirected to your transaction page. Click OK to continue")
    let { cid } = await client.add(this.state.buffer)
    let hash = Object.values(Object.fromEntries(cid._baseCache))
    let url = `https://ipfs.infura.io/ipfs/${hash}`
    let nameValue = document.getElementById("name").value
    let descValue = document.getElementById("description").value
    let uuid = Math.random()
    let jsonObject = {
      "name":nameValue,
      "description":descValue,
      "image": url,
      "uuid":uuid
    }
    let form = document.getElementById("form")
    form.reset()
    fetch('https://nft-minter-api.herokuapp.com/api/add/', {
      method: 'POST', // or 'PUT'
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jsonObject),
    })
    .then(response => response.json())
    .then(data => {
      console.log(data)
      this.state.contract.methods.mintNFT(`https://nft-minter-api.herokuapp.com/api/get_data/${uuid}`).send({
        from:this.state.account
      }).on("transactionHash", function(hash){
        window.open(`https://rinkeby.etherscan.io/tx/${hash}`, "_blank")
      })
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  }

  async componentDidMount(){
    await this.loadWeb3()
    await this.loadBlockchainData()
  }

  async loadWeb3() {
    if (window.ethereum){
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
      this.setState({
        "connected":true
      })
    }else{
      window.alert("Connect with Metamask")
    }
  }

  async loadBlockchainData() {
    const web3 = window.web3
    const accounts = await web3.eth.getAccounts()
    const networkId = await web3.eth.net.getId()
    this.setState({
      "account":accounts[0],
      "networkId":networkId
    })
    if(window.ethereum && networkId !== 4){
      window.alert("Contract not deployed to this network. Switch to the Rinkeby TestNet")
    }else{
      const abi = ConsensusQuizNft.abi
      const contract = await web3.eth.Contract(abi, CONTRACT_ADDRESS)
      this.setState({
        "contract":contract
      })
    }
  }
  render() {
    const renderMintButton = () => {
      if (window.ethereum && this.state.networkId !== 4) {
        return <input type='submit' value='Mint' disabled ></input>
      }else if(this.state.connected === false){
        return <input type='submit' value='Mint' disabled ></input>
      } else {
        return <input type='submit' value='Mint'></input>
      }
    }
    return (
      <div>
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              <div className="content mr-auto ml-auto">
              // eslint-disable-next-line
                <a
                  href="#"
                >
                  <img src={nft} className="App-logo" alt="logo" />
                </a>
                <h1>Your NFT Minter</h1>
                <p><strong>Address:</strong> {this.state.account}</p>
                <form onSubmit={this.submitFormData} id="form"> 
                  <div>
                    <label for="name"><b>Name</b></label>:
                  </div>
                  <div>
                    <input type="text" placeholder="Enter Name" name="name" id="name" required></input>
                  </div>
                  <div>
                  <label for="description"><b>Description</b></label>:
                  </div>
                  <div>
                    <textarea name="description" placeholder="Enter Description" id="description" required></textarea>
                  </div>
                  <div>
                    <label for="file_field"><b>Upload File</b></label>:
                  </div>
                  <div>
                    <input type="file" placeholder="Enter Email" name="file_field" id="file_field" onChange={this.captureFile} required></input>
                  </div>
                  <div>
                  {renderMintButton()}
                  </div>
                </form>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
