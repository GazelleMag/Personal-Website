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
      details: 'this is the details for game development project 1'
    },
    {
      id: 2,
      details: 'this is the details for game development project 2'
    },
    {
      id: 3,
      details: 'this is the details for web development project 3'
    },
    {
      id: 4,
      details: 'this is the details for web development project 4'
    }
  ];

  constructor(private modalService: NgbModal) { }

  ngOnInit(): void {
  }

  openProjectDetailsModal(projectId) {
    const project = this.getProjectDetails(projectId);
    const modalRef = this.modalService.open(ProjectDetailsModalComponent);
    modalRef.componentInstance.projectId = project.id;
    modalRef.componentInstance.projectDetails = project.details;
  }

  getProjectDetails(projectId) {
    return this.projects.find( project => project.id === projectId );
  }

}
