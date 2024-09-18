// App.js
import './App.css';
import MainNavbar from './components/navbar/main_navbar';
import SubNavbar from './components/navbar/sub_navbar';
import MainApp from './components/main_app';
import React from 'react';

function App() {

  return (
    <>
      <div className="">
        <MainNavbar />
        <div className="main2">
          <SubNavbar />
          <MainApp />
        </div>
      </div>
    </>
  );
}

export default App;