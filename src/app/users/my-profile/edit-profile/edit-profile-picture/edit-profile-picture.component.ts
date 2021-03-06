import { Component, OnInit, Input, NgZone } from '@angular/core';
import { NzModalRef, NzModalService, NzMessageService } from 'ng-zorro-antd';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import * as firebase from 'firebase';
import { Observable,  Observer } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';
import { User } from 'src/app/model/user.model';

@Component({
  selector: 'app-edit-profile-picture',
  templateUrl: './edit-profile-picture.component.html',
  styleUrls: ['./edit-profile-picture.component.scss']
})
export class EditProfilePictureComponent implements OnInit {

  @Input() entry;
  @Input() current;
  user;
  email;
  url;
  avatarUrl;
  selectedFile = null;
  fileObj = null;
  loading = false;
  uid = firebase.auth().currentUser.uid

  constructor(private modal: NzModalRef, 
              public router: Router, 
              private modalService: NzModalService, 
              private msg: NzMessageService,
              private fs: AngularFirestore) { }

  ngOnInit(): void {
    this.email = this.modal.getInstance().nzComponentParams.current;
  }

  update(){
    firebase.storage().ref("profilePics").child(this.email).put(this.fileObj);
    var picLocation = "profilePics/"  + this.email;
    var picRef = firebase.storage().ref(picLocation);
    
    picRef.getDownloadURL().then(picUrl => {
      this.url = picUrl;
      this.fs.collection<User>('Users').doc(this.uid).update({
        profilePic: this.url
      });
    });
    this.modalService.closeAll();
  }

  beforeUpload = (file: File) => {
    return new Observable((observer: Observer<boolean>) => {
      const isJPG = file.type === 'image/jpeg';
      
      if (!isJPG) {
        this.msg.error('You can only upload JPG file!' + " Image file type: " + file.type);
        observer.complete();
        return;
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        this.msg.error('Image must smaller than 2MB!');
        observer.complete();
        return;
      }
      // check heightw
      this.checkImageDimension(file).then(dimensionRes => {
        if (!dimensionRes) {
          this.msg.error('Image width and height must be equal and above 300px or above');
          observer.complete();
          return;
        }

        observer.next(isJPG && isLt2M && dimensionRes);
        observer.complete();
      });
    });
  };

  private checkImageDimension(file: File): Promise<boolean> {
    return new Promise(resolve => {
      const img = new Image(); // create image
      img.src = window.URL.createObjectURL(file);
      img.onload = () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        window.URL.revokeObjectURL(img.src!);
        resolve(width === height && width >= 300);
        this.msg.info("Image width: "+ width + "  height: "+height + " type: " + file.type);
              };
    });
  }
  
  handleChange(event){
    var size = event.fileList.length;
    this.fileObj = event.fileList[size - 1].originFileObj;

    this.getBase64(event.file!.originFileObj!, (img: string) => {
      this.loading = false;
      this.avatarUrl = img;
      this.url = null;
    });
    
  }
  
  getBase64(img: File, callback: (img: string) => void): void {
    const reader = new FileReader();
    reader.addEventListener('load', () => callback(reader.result!.toString()));
    reader.readAsDataURL(img);
  }


    
}
  