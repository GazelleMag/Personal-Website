import { Component, OnInit } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProjectDetailsModalComponent } from './project-details-modal/project-details-modal.component';

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.css']
})
export class PortfolioComponent implements OnInit {

  constructor(private modalService: NgbModal) { }

  ngOnInit(): void {
  }

  openProjectDetailsModal() {
    const modalRef = this.modalService.open(ProjectDetailsModalComponent);
    //modalRef.componentInstance.name = 'World';
  }

}
