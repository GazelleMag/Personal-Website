import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-about-me',
  templateUrl: './about-me.component.html',
  styleUrls: ['./about-me.component.css']
})
export class AboutMeComponent implements OnInit {

  constructor() { }

  ngOnInit(): void { }

  public getMyAge(): number {
    let todayDate = new Date();
    let birthDate = new Date('1996-04-22');
    let age = todayDate.getFullYear() - birthDate.getFullYear();
    let month = todayDate.getMonth() - birthDate.getMonth();
    if (month < 0 || month === 0 && todayDate.getDate() < birthDate.getDate()) {
      age--;
    }
    return age;
  }

}
