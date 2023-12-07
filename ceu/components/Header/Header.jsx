import React, { Component } from 'react';
import { Navbar, Nav, Collapse, Dropdown } from 'bootstrap-4-react';
import star from '../../src/assets/star.png'
import star2 from '../../src/assets/star2.png'
import star3 from '../../src/assets/star3.png'

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
      <img className={style.star1} src={star} alt='imagem de uma estrela dourada' />
      <img className={style.star3} src={star3} alt='imagem de uma estrela dourada' />
      <img className={style.star3} src={star3} alt='imagem de uma estrela dourada' />
      


    </div>


  </section>
  );
};

export default Header;