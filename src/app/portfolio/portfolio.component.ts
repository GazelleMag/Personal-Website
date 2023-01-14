import { Component, OnInit, ViewChild } from '@angular/core';
import { NgbAlert, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { ProjectDetailsModalComponent } from './project-details-modal/project-details-modal.component';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.css']
})
export class PortfolioComponent implements OnInit {

  private projects = [
    {
      id: 1,
      title: 'PuntsPats',
      details: 'Developed a 2D top down shooter. The player must defeat incoming enemies and survive as much time as possible.' +
        ' The goal was to make a very simple game, so I could improve my way around the Unity game engine.',
      technologies: 'Unity and C#.',
      inProgress: false,
      github: 'PuntsPats'
    },
    {
      id: 2,
      title: 'Disarray',
      details: 'Developing a 3D fighting multiplayer game where a player can host or join a server in order to play against another' +
        ' player. On the first version, players fight each other one against one in a martial arts manner (combat system), until one is defeated.' +
        ' This project also introduced me to network development.',
      technologies: 'Unity, C# and Mirror.',
      inProgress: true,
      github: 'Disarray'
    },
    {
      id: 3,
      title: 'Personal Website',
      details: 'Developed my personal website to promote myself and my portfolio in a casual way.',
      technologies: 'HTML & CSS, Bootstrap, Angular and Firebase.',
      inProgress: false,
      github: 'Personal-Website'
    },
  ];

  private _error: Subject<any> = new Subject<string>();
  public errorMessage: string = '';
  @ViewChild('selfClosingAlert', { static: false }) selfClosingAlert: NgbAlert;

  constructor(private modalService: NgbModal) { }

  ngOnInit(): void {
    this.setupDownloadUnavailableAlert();
  }

  public openProjectDetailsModal(projectId): void {
    const project = this.getProjectDetails(projectId);
    const modalRef = this.modalService.open(ProjectDetailsModalComponent, {
      centered: true,
      size: 'md'
    });

    this.sendProjectDataToModal(project, modalRef);
  }

  private getProjectDetails(projectId): Object {
    return this.projects.find(project => project.id === projectId);
  }

  private sendProjectDataToModal(project, modalRef): void {
    modalRef.componentInstance.projectId = project.id;
    modalRef.componentInstance.projectTitle = project.title;
    modalRef.componentInstance.projectDetails = project.details;
    modalRef.componentInstance.projectTechnologies = project.technologies;
    modalRef.componentInstance.projectInProgress = project.inProgress;
    modalRef.componentInstance.projectGithub = project.github;
  }

  private setupDownloadUnavailableAlert(): void {
    this._error.subscribe((message) => (this.errorMessage = message));
    this._error.pipe(debounceTime(5000)).subscribe(() => {
      if (this.selfClosingAlert) {
        this.selfClosingAlert.close();
      }
    });
  }

  public showDownloadUnavailableAlert(): void {
    this._error.next('Download unavailable.');
  }

}

