import React from "react";
import Particles from "react-particles-js";
import Form from './Form'
import { storeContext, rootStore } from "./store";
import "./App.css";

// https://rpj.bembi.org/#night-sky
const particleJsParams = {
  particles: {
    number: {
      value: 160,
      density: {
        enable: false
      }
    },
    size: {
      value: 5,
      random: true,
      anim: {
        speed: 4,
        size_min: 0.3
      }
    },
    line_linked: {
      enable: false
    },
    move: {
      random: true,
      speed: 1,
      direction: "top",
      out_mode: "out"
    },
    color: {
      value: `#dedede`
    }
  },
  interactivity: {
    events: {
      onhover: {
        enable: true,
        mode: "bubble"
      },
      onclick: {
        enable: true,
        mode: "repulse"
      }
    },
    modes: {
      bubble: {
        distance: 250,
        duration: 2,
        size: 0,
        opacity: 0
      },
      repulse: {
        distance: 400,
        duration: 4
      }
    }
  }
} as any;


export const StoreProvider = ({ children }: any) => {
  return <storeContext.Provider value={rootStore}>{children}</storeContext.Provider>;
};

const App: React.FC = () => {
  React.useEffect(() => {
    rootStore.init();
  }, [])

  return (
    <StoreProvider>
    <div className="app">
      <div className="app__background">
        <Particles params={particleJsParams} />
      </div>
      <div className="center">
        <header className="header">
          <h1>Team Malta Block - DAPP Hackathon</h1>
          <h2>Liquid Crypto Service - Anonymous Voting Example</h2>
        </header>
        <Form />
      </div>
    </div>
    </StoreProvider>
  );
};

export default App;
