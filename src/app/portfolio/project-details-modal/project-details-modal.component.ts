import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-project-details-modal',
  templateUrl: './project-details-modal.component.html',
  styleUrls: ['./project-details-modal.component.css']
})
export class ProjectDetailsModalComponent implements OnInit {

  @Input() projectId;
  @Input() projectTitle;
  @Input() projectDetails;
  @Input() projectTechnologies;
  @Input() projectInProgress;
  @Input() projectGithub;

  constructor(public activeModal: NgbActiveModal) { }

  ngOnInit(): void { }

  closeProjectDetailsModal() {
    this.activeModal.close();
  }

}
