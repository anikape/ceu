import React, { Component } from 'react';
import { Navbar, Nav, Collapse, Dropdown } from 'bootstrap-4-react';
import star from '../../src/assets/star.png'
import star2 from '../../src/assets/star2.png'
import star3 from '../../src/assets/star3.png'
import plane from '../../src/assets/plane.png'
import logo from '../../src/assets/logoHeader.png'
import planet from '../../src/assets/bluePlanet.png'
import planet2 from '../../src/assets/planet.png'
import style from './header.module.css'

const Header = () => {
 

  return (
  <section className={style.headerContainer}> 
    <div className={style.navbar}>
      <Navbar expand="lg" light >
        {/* <Navbar.Brand href="#">Navbar</Navbar.Brand> */}
        <Navbar.Toggler className={style.toggler} target="#navbarNav" />
        <Collapse navbar id="navbarNav">
          <Navbar.Nav className={style.navContainer}>
            <Nav.ItemLink id='link' className={style.navLink} href="#">Início</Nav.ItemLink>
            <Nav.ItemLink className={style.navLink} href="#">Sobre Nós</Nav.ItemLink>
            <Nav.ItemLink className={style.navLink} href="#">Espaço</Nav.ItemLink>
            <Nav.ItemLink className={style.navLink} href="#">Serviços</Nav.ItemLink>
            <Nav.ItemLink className={style.navLink} href="#">Contato</Nav.ItemLink>
          </Navbar.Nav>
        </Collapse>
      </Navbar>
    </div>

    <div className={style.stars}>
      <img className={style.star1} src={star} alt='imagem de uma estrela dourada' />
      <img className={style.star2} src={star2} alt='imagem de uma estrela dourada' />
      <img className={style.star1} src={star} alt='imagem de uma estrela dourada' />
      <img className={style.star3} src={star3} alt='imagem de uma estrela dourada' />
      <img className={style.star1} src={star} alt='imagem de uma estrela dourada' />
      <img className={style.star2} src={star2} alt='imagem de uma estrela dourada' />
      <img  className={style.star2} src={star2} alt='imagem de uma estrela dourada' />
      <img className={style.star1} src={star} alt='imagem de uma estrela dourada grande' />
      <img className={style.star3} src={star3} alt='imagem de uma estrela dourada' />
      <img className={style.star3} src={star3} alt='imagem de uma estrela dourada' />
      
    
    </div>
    <section className={style.headerContent}>
    <div className={style.foguete}>
      <h1>Bem-vindo ao Centro Educacional Universo Infantil.<br/>
      Onde Cada Criança é uma Estrela em Ascensão!</h1>
      <div className={style.effects}>
        <img className={style.airplane} src={plane} alt='Foguete com 3 crianças' />
        <img className={style.plan1} src={planet} alt='planeta' />
        <img className={style.plan2} src={planet2} alt='planeta' />
      </div>
      
    </div>

    <div className={style.logo}>
      <img className={style.logoImag} src={logo} alt='Logomarca da escola' />
    </div>
    </section>

  </section>
  );
};

export default Header;