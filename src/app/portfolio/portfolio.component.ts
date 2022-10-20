import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProjectDetailsModalComponent } from './project-details-modal/project-details-modal.component';

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.css']
})
export class PortfolioComponent implements OnInit {

  projects = [
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
      details: 'this is the details for game development project 2',
      technologies: '',
      inProgress: true,
      github: 'Disarray'
    },
    {
      id: 3,
      title: 'Personal Website',
      details: 'this is the details for web development project 3',
      technologies: '',
      inProgress: true,
      github: 'Personal-Website'
    },
    {
      id: 4,
      title: 'Sample Website',
      details: 'this is the details for web development project 4',
      technologies: '',
      inProgress: true,
      github: undefined
    }
  ];

  constructor(private modalService: NgbModal) { }

  ngOnInit(): void {
  }

  openProjectDetailsModal(projectId) {
    const project = this.getProjectDetails(projectId);
    const modalRef = this.modalService.open(ProjectDetailsModalComponent, {
      centered: true,
      size: 'md'
    });

    this.sendProjectDataToModal(project, modalRef);
  }

  getProjectDetails(projectId) {
    return this.projects.find(project => project.id === projectId);
  }

  sendProjectDataToModal(project, modalRef) {
    modalRef.componentInstance.projectId = project.id;
    modalRef.componentInstance.projectTitle = project.title;
    modalRef.componentInstance.projectDetails = project.details;
    modalRef.componentInstance.projectTechnologies = project.technologies;
    modalRef.componentInstance.projectInProgress = project.inProgress;
    modalRef.componentInstance.projectGithub = project.github;
  }

}
